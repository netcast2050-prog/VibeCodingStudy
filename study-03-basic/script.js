// ==========================================
// 게임 모드 설정
// ==========================================
const gameModes = {
    full:     { questions: 40, timeLimit: null, label: '전체 도전' },
    category: { questions: 10, timeLimit: null, label: '카테고리별' },
    speed:    { questions: 20, timeLimit: 15,   label: '스피드 퀴즈' }
};

const HINTS_PER_GAME = 3;
const HISTORY_LIMIT = 200;
const LB_LIMIT = 10;
const RECENT_GAMES = 10;

// ==========================================
// 데이터 관리 (localStorage)
// ==========================================
const STORAGE_KEYS = {
    PLAYER:  'quizApp.player',
    HISTORY: 'quizApp.history',
    THEME:   'quizApp.theme'
};

class LocalDataManager {
    getPlayerName() {
        return localStorage.getItem(STORAGE_KEYS.PLAYER) || '';
    }
    setPlayerName(name) {
        if (name) localStorage.setItem(STORAGE_KEYS.PLAYER, name);
    }
    getHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn('history read failed', e);
            return [];
        }
    }
    saveResult(result) {
        const history = this.getHistory();
        history.push(result);
        const trimmed = history.slice(-HISTORY_LIMIT);
        try {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('history save failed', e);
        }
    }
    clearHistory() {
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
    }
    getLeaderboard(filter = {}, limit = LB_LIMIT) {
        const filtered = this._filter(this.getHistory(), filter);
        return [...filtered]
            .sort((a, b) =>
                b.totalScore - a.totalScore
                || new Date(a.timestamp) - new Date(b.timestamp))
            .slice(0, limit);
    }
    getStats(playerName) {
        const all = this.getHistory().filter(e => e.playerName === playerName);
        if (all.length === 0) return null;
        const scores = all.map(e => e.totalScore);
        const totalCorrect = all.reduce((s, e) => s + e.correctAnswers, 0);
        const totalQuestions = all.reduce((s, e) => s + e.totalQuestions, 0);
        const accuracy = totalQuestions > 0
            ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        const catTotals = {};
        for (const e of all) {
            for (const [cat, sc] of Object.entries(e.categoryScores || {})) {
                if (!catTotals[cat]) catTotals[cat] = { correct: 0, total: 0 };
                catTotals[cat].correct += sc.correct;
                catTotals[cat].total   += sc.total;
            }
        }
        return {
            plays: all.length,
            best:  Math.max(...scores),
            avg:   Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            accuracy,
            catTotals,
            recent: all.slice(-RECENT_GAMES)
        };
    }
    _filter(history, { period, category, mode } = {}) {
        let f = history;
        if (period === 'daily') {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            f = f.filter(e => new Date(e.timestamp) >= start);
        } else if (period === 'weekly') {
            const start = new Date(); start.setDate(start.getDate() - 7);
            f = f.filter(e => new Date(e.timestamp) >= start);
        }
        if (category) f = f.filter(e => e.category === category);
        if (mode)     f = f.filter(e => e.mode === mode);
        return f;
    }
    getTheme() {
        const v = localStorage.getItem(STORAGE_KEYS.THEME);
        return ['system', 'dark', 'light'].includes(v) ? v : 'system';
    }
    setTheme(theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }
}

const localData = new LocalDataManager();

// ==========================================
// 테마 관리 (시스템 따름 + 수동 토글)
// ==========================================
class ThemeManager {
    constructor() {
        this.media = window.matchMedia('(prefers-color-scheme: dark)');
        this.media.addEventListener('change', () => this.apply());
    }
    pref() {
        return localData.getTheme();
    }
    effective() {
        const p = this.pref();
        if (p === 'dark' || p === 'light') return p;
        return this.media.matches ? 'dark' : 'light';
    }
    apply() {
        const eff = this.effective();
        document.documentElement.setAttribute('data-theme', eff);
        const emoji = document.getElementById('themeEmoji');
        const btn   = document.getElementById('themeToggle');
        const p = this.pref();
        if (emoji) {
            emoji.textContent = p === 'system' ? '🌓' : (p === 'dark' ? '☀️' : '🌙');
        }
        if (btn) {
            const labels = { system: '시스템 자동', dark: '다크 모드', light: '라이트 모드' };
            btn.title = `테마: ${labels[p]} (클릭해서 전환)`;
        }
    }
    toggle() {
        // system → dark → light → system
        const order = ['system', 'dark', 'light'];
        const idx = order.indexOf(this.pref());
        const next = order[(idx + 1) % order.length];
        localData.setTheme(next);
        this.apply();
    }
}

const themeManager = new ThemeManager();
themeManager.apply();

// ==========================================
// 헬퍼: 토스트 / HTML 이스케이프
// ==========================================
function showToast(message, ms = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('show'), ms);
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// ==========================================
// 점수 시스템
// ==========================================
class ScoreManager {
    constructor() {
        this.BASE = 10;
        this.TIME_BONUS_THRESHOLD = 10; // seconds
        this.TIME_BONUS = 3;
        this.NO_HINT_BONUS = 2;
    }

    getConsecutiveBonus(consecutiveCorrect) {
        // 콤보 보너스: 2연속부터 시작, 누적
        // 2연속 +1, 3연속 +2, 5연속 +5, 10연속 +10
        if (consecutiveCorrect < 2) return 0;
        if (consecutiveCorrect < 3) return 1;
        if (consecutiveCorrect < 5) return 2;
        if (consecutiveCorrect < 10) return 5;
        return 10;
    }

    calculateScore(isCorrect, timeSpent, consecutiveCorrect, hintUsed) {
        const breakdown = { base: 0, time: 0, noHint: 0, combo: 0, total: 0 };
        if (!isCorrect) return breakdown;

        breakdown.base = this.BASE;
        if (timeSpent < this.TIME_BONUS_THRESHOLD) breakdown.time = this.TIME_BONUS;
        if (!hintUsed) breakdown.noHint = this.NO_HINT_BONUS;
        breakdown.combo = this.getConsecutiveBonus(consecutiveCorrect);

        breakdown.total = breakdown.base + breakdown.time + breakdown.noHint + breakdown.combo;
        return breakdown;
    }
}

const scoreManager = new ScoreManager();

// ==========================================
// 게임 상태
// ==========================================
let gameState = createInitialState();

function createInitialState() {
    return {
        mode: 'full',
        category: null,
        questions: [],
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        consecutiveCorrect: 0,
        longestStreak: 0,
        hintsRemaining: HINTS_PER_GAME,
        hintUsedThisQuestion: false,
        eliminatedOptions: [],
        responseTimes: [],
        questionStartTime: 0,
        elapsedBeforePause: 0,
        timerInterval: null,
        timeLimit: null,
        isPaused: false,
        isAnswered: false,
        answers: [],
        categoryScores: {
            "한국사": { correct: 0, total: 0 },
            "세계지리": { correct: 0, total: 0 },
            "과학": { correct: 0, total: 0 },
            "예술과 문화": { correct: 0, total: 0 }
        }
    };
}

// ==========================================
// DOM
// ==========================================
const startScreen        = document.getElementById('startScreen');
const categoryScreen     = document.getElementById('categoryScreen');
const leaderboardScreen  = document.getElementById('leaderboardScreen');
const statsScreen        = document.getElementById('statsScreen');
const quizScreen         = document.getElementById('quizScreen');
const resultScreen       = document.getElementById('resultScreen');
const feedbackModal      = document.getElementById('feedbackModal');
const pauseOverlay       = document.getElementById('pauseOverlay');
const nameModal          = document.getElementById('nameModal');

const nextBtn         = document.getElementById('nextBtn');
const restartBtn      = document.getElementById('restartBtn');
const homeBtn         = document.getElementById('homeBtn');
const hintBtn         = document.getElementById('hintBtn');
const pauseBtn        = document.getElementById('pauseBtn');
const resumeBtn       = document.getElementById('resumeBtn');
const quitBtn         = document.getElementById('quitBtn');
const categoryBackBtn = document.getElementById('categoryBackBtn');

const timerWrap = document.getElementById('timerWrap');
const timerFill = document.getElementById('timerFill');
const timerText = document.getElementById('timerText');
const comboInfo = document.getElementById('comboInfo');
const comboCount = document.getElementById('comboCount');
const hintCount = document.getElementById('hintCount');

// ==========================================
// 화면 전환
// ==========================================
const allScreens = [startScreen, categoryScreen, leaderboardScreen, statsScreen, quizScreen, resultScreen];

function showScreen(screen) {
    allScreens.forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// ==========================================
// 문제 선택
// ==========================================
function pickQuestions(mode, category) {
    const config = gameModes[mode];
    let pool = quizQuestions.slice();

    if (mode === 'category' && category) {
        pool = pool.filter(q => q.category === category);
    }

    // 셔플
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, Math.min(config.questions, pool.length));
}

// ==========================================
// 게임 시작
// ==========================================
function startGame(mode, category = null) {
    const config = gameModes[mode];
    gameState = createInitialState();
    gameState.mode = mode;
    gameState.category = category;
    gameState.timeLimit = config.timeLimit;
    gameState.questions = pickQuestions(mode, category);

    // UI 리셋
    hintCount.textContent = gameState.hintsRemaining;
    hintBtn.disabled = false;
    comboInfo.classList.remove('active');
    comboCount.textContent = 0;
    timerWrap.classList.toggle('active', config.timeLimit !== null);

    feedbackModal.classList.remove('show');
    pauseOverlay.classList.remove('show');

    showScreen(quizScreen);
    loadQuestion();
}

// ==========================================
// 문제 로드
// ==========================================
function loadQuestion() {
    const question = gameState.questions[gameState.currentQuestionIndex];

    gameState.isAnswered = false;
    gameState.hintUsedThisQuestion = false;
    gameState.eliminatedOptions = [];

    updateProgress();

    document.getElementById('categoryBadge').textContent = question.category;
    document.getElementById('questionText').textContent = question.question;

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.dataset.index = index;
        button.textContent = option;
        button.onclick = () => handleAnswer(index);
        optionsContainer.appendChild(button);
    });

    // 힌트 버튼 가용 여부
    hintBtn.disabled = gameState.hintsRemaining === 0;

    // 타이머 시작
    startQuestionTimer();
}

// ==========================================
// 타이머
// ==========================================
function startQuestionTimer() {
    stopQuestionTimer();
    gameState.questionStartTime = performance.now();
    gameState.elapsedBeforePause = 0;

    if (gameState.timeLimit === null) {
        // 전역 응답시간 측정용 타이머만 (UI 없음)
        return;
    }

    updateTimerUI(gameState.timeLimit);

    gameState.timerInterval = setInterval(() => {
        const elapsed = getElapsedSeconds();
        const remaining = Math.max(0, gameState.timeLimit - elapsed);
        updateTimerUI(remaining);

        if (remaining <= 0) {
            stopQuestionTimer();
            handleTimeout();
        }
    }, 100);
}

function stopQuestionTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function getElapsedSeconds() {
    return (performance.now() - gameState.questionStartTime) / 1000 + gameState.elapsedBeforePause;
}

function updateTimerUI(remaining) {
    if (gameState.timeLimit === null) return;
    timerText.textContent = remaining.toFixed(1).replace(/\.0$/, '');
    const ratio = remaining / gameState.timeLimit;
    timerFill.style.width = `${Math.max(0, ratio * 100)}%`;
    timerFill.classList.toggle('warning', ratio <= 0.5 && ratio > 0.25);
    timerFill.classList.toggle('danger', ratio <= 0.25);
}

function handleTimeout() {
    if (gameState.isAnswered) return;
    // 시간 초과 = 오답 처리
    handleAnswer(-1, true);
}

// ==========================================
// 답변 처리
// ==========================================
function handleAnswer(selectedIndex, isTimeout = false) {
    if (gameState.isAnswered || gameState.isPaused) return;
    gameState.isAnswered = true;
    stopQuestionTimer();

    const question = gameState.questions[gameState.currentQuestionIndex];
    const timeSpent = getElapsedSeconds();
    const isCorrect = !isTimeout && selectedIndex === question.correctAnswer;

    // 카테고리 통계
    gameState.categoryScores[question.category].total++;
    if (isCorrect) gameState.categoryScores[question.category].correct++;

    // 응답 시간 기록
    gameState.responseTimes.push(timeSpent);

    // 콤보 업데이트
    if (isCorrect) {
        gameState.consecutiveCorrect++;
        gameState.longestStreak = Math.max(gameState.longestStreak, gameState.consecutiveCorrect);
    } else {
        gameState.consecutiveCorrect = 0;
    }
    updateComboUI();

    // 점수 계산
    const breakdown = scoreManager.calculateScore(
        isCorrect,
        timeSpent,
        gameState.consecutiveCorrect,
        gameState.hintUsedThisQuestion
    );
    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.score += breakdown.total;
    }

    // 답변 저장
    gameState.answers.push({
        questionId: question.id,
        category: question.category,
        selected: selectedIndex,
        correct: question.correctAnswer,
        isCorrect,
        timeSpent,
        hintUsed: gameState.hintUsedThisQuestion,
        scoreEarned: breakdown.total,
        timeout: isTimeout
    });

    // 시각 피드백
    showAnswerFeedback(selectedIndex, question.correctAnswer, isCorrect);

    setTimeout(() => {
        showFeedback(isCorrect, question.explanation, breakdown, isTimeout);
    }, 800);
}

function showAnswerFeedback(selectedIndex, correctIndex, isCorrect) {
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.classList.add('disabled'));

    if (selectedIndex >= 0) {
        if (isCorrect) {
            buttons[selectedIndex].classList.add('correct');
        } else {
            buttons[selectedIndex].classList.add('incorrect');
            buttons[correctIndex].classList.add('correct');
        }
    } else {
        // 시간초과: 정답만 표시
        buttons[correctIndex].classList.add('correct');
    }
}

function showFeedback(isCorrect, explanation, breakdown, isTimeout) {
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackTitle = document.getElementById('feedbackTitle');
    const feedbackExplanation = document.getElementById('feedbackExplanation');
    const breakdownEl = document.getElementById('feedbackBreakdown');

    feedbackIcon.className = `feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`;
    if (isTimeout) feedbackTitle.textContent = '⏰ 시간 초과!';
    else feedbackTitle.textContent = isCorrect ? '정답입니다!' : '틀렸습니다';
    feedbackExplanation.textContent = explanation;

    if (isCorrect && breakdown.total > 0) {
        const rows = [
            ['기본 점수', `+${breakdown.base}`],
            breakdown.time   ? ['⏱ 시간 보너스 (10초 이내)', `+${breakdown.time}`]   : null,
            breakdown.noHint ? ['💡 노힌트 보너스',           `+${breakdown.noHint}`] : null,
            breakdown.combo  ? [`🔥 ${gameState.consecutiveCorrect}연속 콤보`, `+${breakdown.combo}`] : null,
        ].filter(Boolean);
        breakdownEl.innerHTML = rows.map(([k, v]) =>
            `<div class="bd-row"><span>${k}</span><span>${v}</span></div>`
        ).join('') + `<div class="bd-row bd-total"><span>획득 점수</span><span>+${breakdown.total}</span></div>`;
        breakdownEl.classList.add('show');
    } else {
        breakdownEl.classList.remove('show');
        breakdownEl.innerHTML = '';
    }

    feedbackModal.classList.add('show');
}

// ==========================================
// 콤보 UI
// ==========================================
function updateComboUI() {
    if (gameState.consecutiveCorrect >= 2) {
        comboCount.textContent = gameState.consecutiveCorrect;
        comboInfo.classList.remove('active');
        // 재트리거를 위한 reflow
        void comboInfo.offsetWidth;
        comboInfo.classList.add('active');
    } else {
        comboInfo.classList.remove('active');
    }
}

// ==========================================
// 힌트
// ==========================================
function useHint() {
    if (gameState.isAnswered || gameState.isPaused) return;
    if (gameState.hintsRemaining <= 0 || gameState.hintUsedThisQuestion) return;

    const question = gameState.questions[gameState.currentQuestionIndex];
    const wrongIndices = question.options
        .map((_, i) => i)
        .filter(i => i !== question.correctAnswer);

    // 랜덤하게 2개 오답 선택
    for (let i = wrongIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
    }
    const toEliminate = wrongIndices.slice(0, 2);

    gameState.eliminatedOptions = toEliminate;
    gameState.hintsRemaining--;
    gameState.hintUsedThisQuestion = true;
    hintCount.textContent = gameState.hintsRemaining;
    hintBtn.disabled = true;

    // 시각 효과
    document.querySelectorAll('.option-btn').forEach(btn => {
        const idx = parseInt(btn.dataset.index, 10);
        if (toEliminate.includes(idx)) btn.classList.add('eliminated');
    });
}

// ==========================================
// 다음 문제
// ==========================================
function nextQuestion() {
    feedbackModal.classList.remove('show');
    gameState.currentQuestionIndex++;

    if (gameState.currentQuestionIndex < gameState.questions.length) {
        loadQuestion();
    } else {
        endGame();
    }
}

// ==========================================
// 일시정지 / 재개
// ==========================================
function pauseGame() {
    if (gameState.isPaused || gameState.isAnswered) return;
    gameState.isPaused = true;
    // 현재까지 경과 누적
    gameState.elapsedBeforePause += (performance.now() - gameState.questionStartTime) / 1000;
    stopQuestionTimer();
    pauseOverlay.classList.add('show');
}

function resumeGame() {
    if (!gameState.isPaused) return;
    gameState.isPaused = false;
    pauseOverlay.classList.remove('show');
    // 타이머 재시작 (남은 시간 유지)
    gameState.questionStartTime = performance.now();
    if (gameState.timeLimit !== null) {
        gameState.timerInterval = setInterval(() => {
            const elapsed = getElapsedSeconds();
            const remaining = Math.max(0, gameState.timeLimit - elapsed);
            updateTimerUI(remaining);
            if (remaining <= 0) {
                stopQuestionTimer();
                handleTimeout();
            }
        }, 100);
    }
}

function quitGame() {
    pauseOverlay.classList.remove('show');
    stopQuestionTimer();
    showScreen(startScreen);
}

// ==========================================
// 게임 종료 / 결과
// ==========================================
let lastResult = null;

function buildResultObject() {
    const total = gameState.questions.length;
    const accuracy = total > 0 ? Math.round((gameState.correctAnswers / total) * 100) : 0;
    const avgTime = gameState.responseTimes.length > 0
        ? gameState.responseTimes.reduce((a, b) => a + b, 0) / gameState.responseTimes.length
        : 0;

    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        playerName: localData.getPlayerName() || 'Guest',
        mode: gameState.mode,
        modeLabel: gameModes[gameState.mode].label,
        category: gameState.mode === 'category' ? gameState.category : null,
        totalScore: gameState.score,
        correctAnswers: gameState.correctAnswers,
        totalQuestions: total,
        accuracy,
        avgTime: Math.round(avgTime * 10) / 10,
        longestStreak: gameState.longestStreak,
        hintsUsed: HINTS_PER_GAME - gameState.hintsRemaining,
        categoryScores: { ...gameState.categoryScores }
    };
}

function getRecordStatus(result) {
    const history = localData.getHistory();
    let comparable = history.filter(e => e.playerName === result.playerName);
    if (result.mode === 'category') {
        comparable = comparable.filter(e => e.mode === 'category' && e.category === result.category);
    } else {
        comparable = comparable.filter(e => e.mode === result.mode);
    }
    if (comparable.length === 0) return { isFirst: true, prevBest: 0 };
    const prevBest = Math.max(...comparable.map(e => e.totalScore));
    return { isNewBest: result.totalScore > prevBest, prevBest };
}

function endGame() {
    stopQuestionTimer();
    const result = buildResultObject();
    const recordStatus = getRecordStatus(result);
    localData.saveResult(result);
    lastResult = result;
    displayResults(result, recordStatus);
    showScreen(resultScreen);
}

function displayResults(result, recordStatus) {
    document.getElementById('finalScore').textContent = result.totalScore;
    document.getElementById('correctCount').textContent = `${result.correctAnswers} / ${result.totalQuestions}`;
    document.getElementById('accuracyRate').textContent = `${result.accuracy}%`;
    document.getElementById('avgTime').textContent = `${result.avgTime}초`;
    document.getElementById('longestStreak').textContent = result.longestStreak;
    document.getElementById('modeLabel').textContent = result.mode === 'category' && result.category
        ? `${result.modeLabel} · ${result.category}`
        : result.modeLabel;

    // 신기록 배지 / 부제
    const badge    = document.getElementById('newRecordBadge');
    const subtitle = document.getElementById('resultSubtitle');
    badge.hidden = true;
    if (recordStatus.isNewBest) {
        badge.hidden = false;
        badge.textContent = `🌟 신기록! 이전 최고 ${recordStatus.prevBest}점`;
        subtitle.textContent = `${result.playerName}님, 자기 최고 점수를 ${result.totalScore - recordStatus.prevBest}점 갱신했습니다!`;
    } else if (recordStatus.isFirst) {
        badge.hidden = false;
        badge.textContent = `🎯 첫 도전 완료!`;
        subtitle.textContent = `${result.modeLabel} 모드 첫 기록이 저장되었습니다.`;
    } else {
        subtitle.textContent = `이번 모드 최고 ${recordStatus.prevBest}점 · 도전 계속!`;
    }

    // 카테고리 결과
    const categoryResults = document.getElementById('categoryResults');
    categoryResults.innerHTML = '';
    for (const [category, scores] of Object.entries(result.categoryScores)) {
        if (scores.total === 0) continue;
        const pct = Math.round((scores.correct / scores.total) * 100);
        const div = document.createElement('div');
        div.className = 'category-result';
        div.innerHTML = `
            <span class="category-name">${escapeHtml(category)}</span>
            <span class="category-score">${scores.correct} / ${scores.total} (${pct}%)</span>
        `;
        categoryResults.appendChild(div);
    }
}

// ==========================================
// 결과 공유 (클립보드 복사)
// ==========================================
function formatShareText(result) {
    const modeStr = result.mode === 'category' && result.category
        ? `${result.modeLabel} · ${result.category}`
        : result.modeLabel;
    return `🎯 퀴즈 게임 결과
플레이어: ${result.playerName}
모드: ${modeStr}
점수: ${result.totalScore}점
정답: ${result.correctAnswers}/${result.totalQuestions} (${result.accuracy}%)
최장 연속: ${result.longestStreak}회
${new Date(result.timestamp).toLocaleString('ko-KR')}`;
}

async function copyResult() {
    if (!lastResult) return;
    const text = formatShareText(lastResult);
    try {
        await navigator.clipboard.writeText(text);
        showToast('결과가 클립보드에 복사되었습니다 ✓');
        return;
    } catch (e) {
        // fallback
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('결과가 클립보드에 복사되었습니다 ✓');
    } catch (e) {
        showToast('복사에 실패했습니다');
    }
}

// ==========================================
// 리더보드 화면
// ==========================================
const lbState = { tab: 'all', category: '한국사' };

function showLeaderboard() {
    showScreen(leaderboardScreen);
    renderLeaderboard();
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    const empty = document.getElementById('lbEmpty');
    const catFilter = document.getElementById('lbCatFilter');

    document.querySelectorAll('.lb-tab').forEach(btn => {
        const active = btn.dataset.tab === lbState.tab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active);
    });
    catFilter.hidden = lbState.tab !== 'category';
    document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === lbState.category);
    });

    const filter = {};
    if (lbState.tab === 'daily') filter.period = 'daily';
    else if (lbState.tab === 'weekly') filter.period = 'weekly';
    else if (lbState.tab === 'category') {
        filter.category = lbState.category;
        filter.mode = 'category';
    }

    const entries = localData.getLeaderboard(filter, LB_LIMIT);
    const currentName = localData.getPlayerName();

    list.innerHTML = '';
    if (entries.length === 0) {
        empty.hidden = false;
        return;
    }
    empty.hidden = true;

    entries.forEach((entry, idx) => {
        const rank = idx + 1;
        const row = document.createElement('div');
        row.className = 'lb-row' + (entry.playerName === currentName ? ' is-self' : '');
        const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
        const date = new Date(entry.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        const modeStr = entry.mode === 'category' && entry.category
            ? `${entry.modeLabel} · ${entry.category}`
            : entry.modeLabel;
        row.innerHTML = `
            <div class="lb-rank ${rankClass}">${rank}</div>
            <div class="lb-info">
                <div class="lb-name">${escapeHtml(entry.playerName)}</div>
                <div class="lb-meta">${escapeHtml(modeStr)} · ${date}</div>
            </div>
            <div class="lb-score">${entry.totalScore}</div>
        `;
        list.appendChild(row);
    });
}

// ==========================================
// 통계 / 대시보드 화면
// ==========================================
const ALL_CATEGORIES = ['한국사', '세계지리', '과학', '예술과 문화'];

function showStats() {
    showScreen(statsScreen);
    renderStats();
}

function renderStats() {
    const playerName = localData.getPlayerName() || 'Guest';
    document.getElementById('statsPlayerName').textContent = playerName;

    const stats = localData.getStats(playerName);
    const empty   = document.getElementById('statsEmpty');
    const content = document.getElementById('statsContent');

    if (!stats) {
        empty.hidden = false;
        content.hidden = true;
        return;
    }
    empty.hidden = true;
    content.hidden = false;

    document.getElementById('statPlays').textContent    = stats.plays;
    document.getElementById('statBest').textContent     = stats.best;
    document.getElementById('statAvg').textContent      = stats.avg;
    document.getElementById('statAccuracy').textContent = stats.accuracy + '%';

    // 카테고리별 정답률
    const catList = document.getElementById('catStatList');
    catList.innerHTML = '';
    for (const cat of ALL_CATEGORIES) {
        const data    = stats.catTotals[cat] || { correct: 0, total: 0 };
        const pct     = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        const row = document.createElement('div');
        row.className = 'cat-stat-row';
        row.innerHTML = `
            <div class="cat-stat-name">${escapeHtml(cat)}</div>
            <div class="cat-stat-bar"><div class="cat-stat-fill" style="width: ${pct}%"></div></div>
            <div class="cat-stat-val">${pct}% (${data.correct}/${data.total})</div>
        `;
        catList.appendChild(row);
    }

    // 최근 점수 추이
    const chart = document.getElementById('scoreChart');
    chart.innerHTML = '';
    const recent = stats.recent;
    if (recent.length === 0) {
        chart.innerHTML = '<p style="color:var(--text-tertiary);width:100%;text-align:center;align-self:center;">아직 데이터가 없습니다</p>';
        return;
    }
    const max = Math.max(...recent.map(r => r.totalScore), 1);
    recent.forEach((entry, idx) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${(entry.totalScore / max) * 100}%`;
        bar.style.animationDelay = `${idx * 60}ms`;
        bar.title = `${entry.totalScore}점 · ${new Date(entry.timestamp).toLocaleString('ko-KR')}`;
        bar.innerHTML = `
            <span class="bar-value">${entry.totalScore}</span>
            <span class="bar-tick">${idx + 1}</span>
        `;
        chart.appendChild(bar);
    });
}

// ==========================================
// 이름 입력 모달
// ==========================================
function showNameModal() {
    const input = document.getElementById('nameInput');
    const error = document.getElementById('nameError');
    error.hidden = true;
    input.value = localData.getPlayerName() || '';
    nameModal.classList.add('show');
    setTimeout(() => input.focus(), 50);
}

function hideNameModal() {
    nameModal.classList.remove('show');
}

function confirmName() {
    const input = document.getElementById('nameInput');
    const error = document.getElementById('nameError');
    const name = input.value.trim();
    if (!name) {
        error.textContent = '이름을 입력해주세요';
        error.hidden = false;
        return;
    }
    if (name.length > 12) {
        error.textContent = '12자 이하로 입력해주세요';
        error.hidden = false;
        return;
    }
    localData.setPlayerName(name);
    document.getElementById('playerNameDisplay').textContent = name;
    hideNameModal();
}

function initPlayerName() {
    const stored = localData.getPlayerName();
    if (stored) {
        document.getElementById('playerNameDisplay').textContent = stored;
    } else {
        showNameModal();
    }
}

// ==========================================
// 진행률
// ==========================================
function updateProgress() {
    const current = gameState.currentQuestionIndex + 1;
    const total = gameState.questions.length;

    document.getElementById('currentQuestion').textContent = current;
    document.getElementById('totalQuestions').textContent = total;
    document.getElementById('currentScore').textContent = gameState.score;

    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${(current / total) * 100}%`;
}

// ==========================================
// 이벤트 리스너
// ==========================================
document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        if (mode === 'category') {
            showScreen(categoryScreen);
        } else {
            startGame(mode);
        }
    });
});

document.querySelectorAll('.category-select-card').forEach(card => {
    card.addEventListener('click', () => {
        startGame('category', card.dataset.category);
    });
});

categoryBackBtn.addEventListener('click', () => showScreen(startScreen));

nextBtn.addEventListener('click', nextQuestion);
hintBtn.addEventListener('click', useHint);
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);
quitBtn.addEventListener('click', quitGame);

restartBtn.addEventListener('click', () => {
    // 같은 모드/카테고리로 재시작
    startGame(gameState.mode, gameState.category);
});
homeBtn.addEventListener('click', () => showScreen(startScreen));

// ==========================================
// 새 화면 트리거 (리더보드 / 통계 / 공유 / 이름 / 테마)
// ==========================================
document.getElementById('openLeaderboardBtn').addEventListener('click', showLeaderboard);
document.getElementById('openStatsBtn').addEventListener('click', showStats);
document.getElementById('resultLeaderboardBtn').addEventListener('click', showLeaderboard);
document.getElementById('shareBtn').addEventListener('click', copyResult);

document.querySelectorAll('.back-home-btn').forEach(btn =>
    btn.addEventListener('click', () => showScreen(startScreen))
);

// 리더보드 탭 / 카테고리 필터
document.querySelectorAll('.lb-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        lbState.tab = btn.dataset.tab;
        renderLeaderboard();
    });
});
document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
        lbState.category = btn.dataset.cat;
        renderLeaderboard();
    });
});

// 기록 초기화
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    if (confirm('모든 기록을 삭제하시겠습니까? 되돌릴 수 없습니다.')) {
        localData.clearHistory();
        renderStats();
        showToast('기록이 초기화되었습니다');
    }
});

// 이름 입력
document.getElementById('playerPill').addEventListener('click', showNameModal);
document.getElementById('nameConfirm').addEventListener('click', confirmName);
document.getElementById('nameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmName();
});

// 테마 토글
document.getElementById('themeToggle').addEventListener('click', () => themeManager.toggle());

// ==========================================
// 키보드 단축키
// ==========================================
document.addEventListener('keydown', (e) => {
    // 일시정지 단축키
    if (e.key === 'Escape' && quizScreen.classList.contains('active')) {
        if (gameState.isPaused) resumeGame();
        else if (!gameState.isAnswered) pauseGame();
        return;
    }

    if (gameState.isPaused) return;

    if (quizScreen.classList.contains('active') && !gameState.isAnswered) {
        // 1-4: 답변 선택
        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key, 10) - 1;
            const buttons = document.querySelectorAll('.option-btn');
            if (buttons[index] && !buttons[index].classList.contains('eliminated')) {
                handleAnswer(index);
            }
        }
        // h: 힌트
        if (e.key.toLowerCase() === 'h' && !hintBtn.disabled) {
            useHint();
        }
    } else if (feedbackModal.classList.contains('show')) {
        if (e.key === 'Enter') nextQuestion();
    }
});

// ==========================================
// 초기화
// ==========================================
initPlayerName();
