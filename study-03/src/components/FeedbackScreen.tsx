import { useGameStore } from '../store/useGameStore';

type FeedbackKind = 'correct' | 'wrong' | 'timeout';

const HEADER: Record<
  FeedbackKind,
  { label: string; container: string; text: string }
> = {
  correct: {
    label: '정답! ✅',
    container: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  wrong: {
    label: '오답 ❌',
    container: 'bg-rose-50',
    text: 'text-rose-700',
  },
  timeout: {
    label: '시간 초과 ⏱️',
    container: 'bg-amber-50',
    text: 'text-amber-700',
  },
};

export function FeedbackScreen() {
  const questions = useGameStore((s) => s.questions);
  const currentIndex = useGameStore((s) => s.currentIndex);
  const answers = useGameStore((s) => s.answers);
  const nextQuestion = useGameStore((s) => s.nextQuestion);

  const current = questions[currentIndex];
  if (!current) return null;

  const userAnswer = answers[currentIndex];
  const isTimeout = userAnswer === null || userAnswer === undefined;
  const isCorrect = !isTimeout && userAnswer === current.answer;
  const kind: FeedbackKind = isCorrect
    ? 'correct'
    : isTimeout
      ? 'timeout'
      : 'wrong';
  const header = HEADER[kind];
  const isLast = currentIndex >= questions.length - 1;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl sm:p-10">
        <div
          className={`mb-6 rounded-2xl px-6 py-5 text-center ${header.container}`}
        >
          <p className={`text-3xl font-extrabold ${header.text}`}>
            {header.label}
          </p>
        </div>

        <h2 className="mb-6 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
          Q. {current.question}
        </h2>

        <div className="mb-6 flex flex-col gap-2">
          {current.options.map((opt, idx) => {
            const isAnswer = idx === current.answer;
            const isPicked = !isTimeout && idx === userAnswer;

            let style = 'border-slate-200 bg-slate-50 text-slate-500';
            let badge = 'bg-slate-200 text-slate-500';
            let suffix: string | null = null;
            let animation = '';

            if (isAnswer) {
              style = 'border-emerald-400 bg-emerald-50 text-emerald-900';
              badge = 'bg-emerald-500 text-white';
              suffix = '정답';
              if (isCorrect) animation = 'animate-flash';
            } else if (isPicked) {
              style = 'border-rose-400 bg-rose-50 text-rose-900';
              badge = 'bg-rose-500 text-white';
              suffix = '내 선택';
              animation = 'animate-shake';
            }

            return (
              <div
                key={idx}
                className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 py-3 text-base ${style} ${animation}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badge}`}
                >
                  {idx + 1}
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

        <div className="mb-8 rounded-2xl bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700">
            💡 해설
          </p>
          <p>{current.explanation}</p>
        </div>

        <button
          type="button"
          onClick={nextQuestion}
          className="min-h-12 w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99]"
        >
          {isLast ? '결과 보기 →' : '다음 문제 →'}
        </button>
      </div>
    </div>
  );
}
