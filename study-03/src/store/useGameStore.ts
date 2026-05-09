import { create } from 'zustand';
import type { Category, GameState, Question, ScoreRecord } from '../types';
import { questions as allQuestions } from '../data/questions';

const STORAGE_KEY = 'quiz-leaderboard';
const SINGLE_CATEGORY_SIZE = 10;
const FULL_CHALLENGE_SIZE = 40;

const emptyBreakdown = (): Record<Category, number> => ({
  한국사: 0,
  과학: 0,
  지리: 0,
  '예술과 문화': 0,
});

const shuffle = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const initialState: GameState = {
  screen: 'home',
  selectedCategory: '전체',
  questions: [],
  currentIndex: 0,
  selectedOption: null,
  score: 0,
  answers: [],
  nickname: '',
};

interface GameActions {
  startGame: (category: Category | '전체') => void;
  selectOption: (index: number) => void;
  submitAnswer: () => void;
  timeoutAnswer: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
  saveScore: (nickname: string) => void;
  getLeaderboard: () => ScoreRecord[];
  goToLeaderboard: () => void;
  goToReview: () => void;
  exitReview: () => void;
  goHome: () => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  startGame: (category) => {
    const pool =
      category === '전체'
        ? allQuestions
        : allQuestions.filter((q) => q.category === category);

    const targetSize =
      category === '전체' ? FULL_CHALLENGE_SIZE : SINGLE_CATEGORY_SIZE;

    const picked = shuffle(pool).slice(0, Math.min(targetSize, pool.length));

    set({
      screen: 'quiz',
      selectedCategory: category,
      questions: picked,
      currentIndex: 0,
      selectedOption: null,
      score: 0,
      answers: Array(picked.length).fill(null),
      nickname: '',
    });
  },

  selectOption: (index) => {
    set({ selectedOption: index });
  },

  submitAnswer: () => {
    const { selectedOption, questions, currentIndex, score, answers } = get();
    if (selectedOption === null) return;

    const current = questions[currentIndex];
    const isCorrect = current.answer === selectedOption;
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = selectedOption;

    set({
      score: isCorrect ? score + 1 : score,
      answers: nextAnswers,
      screen: 'feedback',
    });
  },

  timeoutAnswer: () => {
    const { currentIndex, answers, screen } = get();
    if (screen !== 'quiz') return;

    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = null;

    set({
      selectedOption: null,
      answers: nextAnswers,
      screen: 'feedback',
    });
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    const isLast = currentIndex >= questions.length - 1;

    if (isLast) {
      set({ screen: 'result' });
    } else {
      set({
        currentIndex: currentIndex + 1,
        selectedOption: null,
        screen: 'quiz',
      });
    }
  },

  resetGame: () => set({ ...initialState }),

  saveScore: (nickname) => {
    const { score, questions, selectedCategory, answers } = get();
    const breakdown = emptyBreakdown();

    questions.forEach((q: Question, idx) => {
      if (answers[idx] === q.answer) {
        breakdown[q.category] += 1;
      }
    });

    const record: ScoreRecord = {
      nickname: nickname.trim() || 'Player',
      score,
      total: questions.length,
      category: selectedCategory,
      timestamp: new Date().toISOString(),
      breakdown,
    };

    const existing = readLeaderboard();
    const updated = [...existing, record].sort((a, b) => {
      const ratioA = a.score / a.total;
      const ratioB = b.score / b.total;
      if (ratioB !== ratioA) return ratioB - ratioA;
      return a.timestamp < b.timestamp ? -1 : 1;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ nickname: record.nickname });
  },

  getLeaderboard: () => readLeaderboard().slice(0, 10),

  goToLeaderboard: () => set({ screen: 'leaderboard' }),
  goToReview: () => set({ screen: 'review' }),
  exitReview: () => set({ screen: 'result' }),
  goHome: () => set({ ...initialState }),
}));

function readLeaderboard(): ScoreRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
