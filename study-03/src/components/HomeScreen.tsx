import { useGameStore } from '../store/useGameStore';
import type { Category } from '../types';

interface CategoryEntry {
  key: Category | '전체';
  emoji: string;
  label: string;
  hint: string;
}

const entries: CategoryEntry[] = [
  { key: '한국사', emoji: '🏛️', label: '한국사', hint: '10문제' },
  { key: '과학', emoji: '🔬', label: '과학', hint: '10문제' },
  { key: '지리', emoji: '🌍', label: '지리', hint: '10문제' },
  {
    key: '예술과 문화',
    emoji: '🎨',
    label: '예술과 문화',
    hint: '10문제',
  },
  { key: '전체', emoji: '⚡', label: '전체 도전', hint: '40문제' },
];

export function HomeScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const goToLeaderboard = useGameStore((s) => s.goToLeaderboard);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-slate-900">
            상식 퀴즈
          </h1>
          <p className="text-sm text-slate-500">
            카테고리를 골라 도전하고 등급을 확인해보세요.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {entries.map(({ key, emoji, label, hint }) => {
            const isFull = key === '전체';
            return (
              <button
                key={key}
                type="button"
                onClick={() => startGame(key)}
                className={`group flex min-h-14 items-center justify-between rounded-2xl border px-5 py-4 text-left transition active:scale-[0.99] ${
                  isFull
                    ? 'border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:bg-indigo-100'
                    : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{emoji}</span>
                  <div>
                    <p
                      className={`text-lg font-semibold ${
                        isFull ? 'text-indigo-700' : 'text-slate-900'
                      }`}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-slate-500">{hint}</p>
                  </div>
                </div>
                <span
                  className={`text-xl transition ${
                    isFull
                      ? 'text-indigo-500 group-hover:translate-x-1'
                      : 'text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-500'
                  }`}
                >
                  →
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <button
            type="button"
            onClick={goToLeaderboard}
            className="inline-flex min-h-12 items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-slate-500 underline-offset-4 hover:text-indigo-600 hover:underline"
          >
            🏆 순위 보기
          </button>
        </div>
      </div>
    </div>
  );
}
