import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

const QUESTION_SECONDS = 20;
const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getTimerColor(timeLeft: number) {
  if (timeLeft <= 5) return { stroke: '#ef4444', text: 'text-rose-500' };
  if (timeLeft <= 10) return { stroke: '#f59e0b', text: 'text-amber-500' };
  return { stroke: '#10b981', text: 'text-emerald-600' };
}

export function QuizScreen() {
  const questions = useGameStore((s) => s.questions);
  const currentIndex = useGameStore((s) => s.currentIndex);
  const selectedOption = useGameStore((s) => s.selectedOption);
  const selectedCategory = useGameStore((s) => s.selectedCategory);
  const selectOption = useGameStore((s) => s.selectOption);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const timeoutAnswer = useGameStore((s) => s.timeoutAnswer);
  const resetGame = useGameStore((s) => s.resetGame);

  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);

  useEffect(() => {
    setTimeLeft(QUESTION_SECONDS);
  }, [currentIndex]);

  useEffect(() => {
    if (timeLeft <= 0) {
      timeoutAnswer();
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, timeoutAnswer]);

  const current = questions[currentIndex];
  if (!current) return null;

  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;
  const hasSelection = selectedOption !== null;
  const timerColor = getTimerColor(timeLeft);
  const dashOffset = CIRCUMFERENCE * (1 - timeLeft / QUESTION_SECONDS);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl sm:p-10">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <span className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">
            {selectedCategory}
          </span>

          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-500">
              {currentIndex + 1} / {total}
            </span>
            <div className="relative h-14 w-14">
              <svg
                className="h-14 w-14 -rotate-90"
                viewBox="0 0 64 64"
                aria-hidden="true"
              >
                <circle
                  cx="32"
                  cy="32"
                  r={RADIUS}
                  stroke="#e2e8f0"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={RADIUS}
                  stroke={timerColor.stroke}
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition:
                      'stroke-dashoffset 1s linear, stroke 0.3s ease',
                  }}
                />
              </svg>
              <span
                className={`absolute inset-0 flex items-center justify-center text-base font-bold tabular-nums ${timerColor.text}`}
                aria-live="polite"
              >
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100 sm:mb-8">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 className="mb-6 text-xl font-bold leading-snug text-slate-900 sm:mb-8 sm:text-3xl">
          Q. {current.question}
        </h2>

        <div className="mb-6 flex flex-col gap-3 sm:mb-8">
          {current.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => selectOption(idx)}
                className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base transition-all duration-150 active:scale-[0.99] ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/60'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                    isSelected
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={submitAnswer}
          disabled={!hasSelection}
          className="min-h-12 w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          정답 확인
        </button>

        <button
          type="button"
          onClick={resetGame}
          className="mt-4 block w-full text-center text-sm text-slate-400 hover:text-slate-600"
        >
          그만두기
        </button>
      </div>
    </div>
  );
}
