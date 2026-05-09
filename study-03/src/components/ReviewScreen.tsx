import { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { Question } from '../types';

interface WrongItem {
  question: Question;
  userAnswer: number | null;
  originalIndex: number;
}

export function ReviewScreen() {
  const questions = useGameStore((s) => s.questions);
  const answers = useGameStore((s) => s.answers);
  const exitReview = useGameStore((s) => s.exitReview);

  const wrongItems = useMemo<WrongItem[]>(() => {
    return questions
      .map((q, i) => ({
        question: q,
        userAnswer: answers[i] ?? null,
        originalIndex: i,
      }))
      .filter((item) => item.userAnswer !== item.question.answer);
  }, [questions, answers]);

  const [idx, setIdx] = useState(0);

  if (wrongItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl sm:p-10">
          <p className="mb-3 text-5xl">🎉</p>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            틀린 문제가 없어요!
          </h2>
          <p className="mb-8 text-sm text-slate-500">
            완벽한 점수를 기록하셨네요. 멋져요!
          </p>
          <button
            type="button"
            onClick={exitReview}
            className="min-h-12 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            결과로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const item = wrongItems[idx];
  const { question, userAnswer } = item;
  const isTimeout = userAnswer === null;
  const total = wrongItems.length;
  const isLast = idx >= total - 1;
  const progress = ((idx + 1) / total) * 100;

  const handleNext = () => {
    if (isLast) {
      exitReview();
    } else {
      setIdx((v) => v + 1);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl sm:p-10">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-700">
            📖 오답 복습
          </span>
          <span className="font-medium text-slate-500">
            {idx + 1} / {total}
          </span>
        </div>

        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100 sm:mb-8">
          <div
            className="h-full rounded-full bg-rose-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
            {question.category}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
            {question.difficulty}
          </span>
          <span className="text-slate-400">
            (원래 {item.originalIndex + 1}번 문제)
          </span>
        </div>

        <h2 className="mb-6 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
          Q. {question.question}
        </h2>

        <div className="mb-6 flex flex-col gap-2">
          {question.options.map((opt, optIdx) => {
            const isAnswer = optIdx === question.answer;
            const isPicked = !isTimeout && optIdx === userAnswer;

            let style = 'border-slate-200 bg-slate-50 text-slate-500';
            let badge = 'bg-slate-200 text-slate-500';
            let suffix: string | null = null;

            if (isAnswer) {
              style = 'border-emerald-400 bg-emerald-50 text-emerald-900';
              badge = 'bg-emerald-500 text-white';
              suffix = '정답';
            } else if (isPicked) {
              style = 'border-rose-400 bg-rose-50 text-rose-900';
              badge = 'bg-rose-500 text-white';
              suffix = '내 선택';
            }

            return (
              <div
                key={optIdx}
                className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 py-3 text-base ${style}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badge}`}
                >
                  {optIdx + 1}
                </span>
                <span className="flex-1">{opt}</span>
                {suffix && (
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {suffix}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {isTimeout && (
          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⏱️ 시간 초과로 답을 선택하지 못한 문제예요.
          </div>
        )}

        <div className="mb-8 rounded-2xl bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700">
            💡 해설
          </p>
          <p>{question.explanation}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={exitReview}
            className="min-h-12 flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            결과로 돌아가기
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="min-h-12 flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
          >
            {isLast ? '복습 완료 →' : '다음 오답 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
