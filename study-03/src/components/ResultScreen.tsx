import { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { Category, Grade } from '../types';

const CATEGORIES: Category[] = ['한국사', '과학', '지리', '예술과 문화'];

const CATEGORY_EMOJI: Record<Category, string> = {
  한국사: '🏛️',
  과학: '🔬',
  지리: '🌍',
  '예술과 문화': '🎨',
};

function gradeOf(ratio: number): Grade {
  if (ratio >= 0.9) return 'S';
  if (ratio >= 0.75) return 'A';
  if (ratio >= 0.55) return 'B';
  if (ratio >= 0.35) return 'C';
  return 'D';
}

const GRADE_STYLE: Record<Grade, { badge: string; text: string }> = {
  S: { badge: 'bg-indigo-900 text-white', text: 'text-indigo-900' },
  A: { badge: 'bg-emerald-500 text-white', text: 'text-emerald-600' },
  B: { badge: 'bg-amber-400 text-white', text: 'text-amber-500' },
  C: { badge: 'bg-slate-400 text-white', text: 'text-slate-500' },
  D: { badge: 'bg-rose-500 text-white', text: 'text-rose-600' },
};

const GRADE_LABEL: Record<Grade, string> = {
  S: '완벽해요!',
  A: '훌륭해요!',
  B: '좋아요!',
  C: '조금 더 도전해봐요',
  D: '다시 한 번!',
};

export function ResultScreen() {
  const score = useGameStore((s) => s.score);
  const questions = useGameStore((s) => s.questions);
  const answers = useGameStore((s) => s.answers);
  const saveScore = useGameStore((s) => s.saveScore);
  const goToLeaderboard = useGameStore((s) => s.goToLeaderboard);
  const goToReview = useGameStore((s) => s.goToReview);
  const startGame = useGameStore((s) => s.startGame);
  const selectedCategory = useGameStore((s) => s.selectedCategory);
  const goHome = useGameStore((s) => s.goHome);

  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);

  const total = questions.length;
  const ratio = total === 0 ? 0 : score / total;
  const grade = gradeOf(ratio);

  const wrongCount = useMemo(
    () =>
      questions.reduce(
        (acc, q, idx) => (answers[idx] === q.answer ? acc : acc + 1),
        0,
      ),
    [questions, answers],
  );

  const breakdown = useMemo(() => {
    const stats: Record<Category, { correct: number; total: number }> = {
      한국사: { correct: 0, total: 0 },
      과학: { correct: 0, total: 0 },
      지리: { correct: 0, total: 0 },
      '예술과 문화': { correct: 0, total: 0 },
    };
    questions.forEach((q, idx) => {
      stats[q.category].total += 1;
      if (answers[idx] === q.answer) stats[q.category].correct += 1;
    });
    return stats;
  }, [questions, answers]);

  const handleSave = () => {
    if (nickname.trim().length === 0) return;
    saveScore(nickname);
    setSaved(true);
  };

  const gradeStyle = GRADE_STYLE[grade];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-slate-500">
            최종 결과
          </p>
          <div
            className={`mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full text-5xl font-black shadow-lg ${gradeStyle.badge}`}
          >
            {grade}
          </div>
          <p className={`mb-1 text-sm font-semibold ${gradeStyle.text}`}>
            {GRADE_LABEL[grade]}
          </p>
          <p className="text-4xl font-extrabold text-slate-900">
            {score}{' '}
            <span className="text-2xl font-bold text-slate-400">/ {total}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            정답률 {Math.round(ratio * 100)}%
          </p>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-sm font-bold text-slate-700">
            카테고리별 정답률
          </p>
          <div className="flex flex-col gap-3">
            {CATEGORIES.map((cat) => {
              const { correct, total: catTotal } = breakdown[cat];
              const catRatio = catTotal === 0 ? 0 : correct / catTotal;
              const percent = Math.round(catRatio * 100);
              const isEmpty = catTotal === 0;
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {CATEGORY_EMOJI[cat]} {cat}
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      {isEmpty ? '—' : `${correct}/${catTotal} (${percent}%)`}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isEmpty
                          ? 'bg-slate-200'
                          : percent >= 75
                            ? 'bg-emerald-500'
                            : percent >= 50
                              ? 'bg-indigo-500'
                              : percent >= 25
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                      }`}
                      style={{ width: `${isEmpty ? 0 : percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6 border-t border-slate-100 pt-6">
          {!saved ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                maxLength={12}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 입력 (최대 12자)"
                className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={nickname.trim().length === 0}
                className="min-h-12 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                기록 저장
              </button>
            </div>
          ) : (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              ✅ 기록이 저장되었습니다!
            </p>
          )}
        </div>

        {wrongCount > 0 && (
          <button
            type="button"
            onClick={goToReview}
            className="mb-3 min-h-12 w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-400 active:scale-[0.99]"
          >
            📖 오답 복습 ({wrongCount}문제)
          </button>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => startGame(selectedCategory)}
            className="min-h-12 flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 active:scale-[0.99]"
          >
            🔄 다시 도전
          </button>
          <button
            type="button"
            onClick={goToLeaderboard}
            className="min-h-12 flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            🏆 순위 보기
          </button>
          <button
            type="button"
            onClick={goHome}
            className="min-h-12 flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            🏠 홈으로
          </button>
        </div>
      </div>
    </div>
  );
}
