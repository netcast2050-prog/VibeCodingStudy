import { useGameStore } from '../store/useGameStore';

const RANK_STYLE = [
  'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-md',
  'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-md',
  'bg-gradient-to-br from-orange-400 to-amber-700 text-white shadow-md',
];

const RANK_ROW_HIGHLIGHT = [
  'bg-amber-50 border-amber-200',
  'bg-slate-50 border-slate-200',
  'bg-orange-50 border-orange-200',
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function LeaderboardScreen() {
  const getLeaderboard = useGameStore((s) => s.getLeaderboard);
  const goHome = useGameStore((s) => s.goHome);

  const records = getLeaderboard();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-6 text-center">
          <h1 className="mb-1 text-3xl font-extrabold text-slate-900">
            🏆 명예의 전당
          </h1>
          <p className="text-sm text-slate-500">상위 10명의 도전 기록</p>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 py-16 text-center">
            <p className="mb-1 text-4xl">🎯</p>
            <p className="text-sm text-slate-500">
              아직 등록된 기록이 없습니다.
              <br />첫 번째 도전자가 되어보세요!
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 hidden grid-cols-12 gap-2 px-3 text-xs font-bold uppercase tracking-wide text-slate-400 sm:grid">
              <div className="col-span-1">순위</div>
              <div className="col-span-3">닉네임</div>
              <div className="col-span-3 text-center">점수</div>
              <div className="col-span-3">카테고리</div>
              <div className="col-span-2 text-right">날짜</div>
            </div>

            <ol className="flex flex-col gap-2">
              {records.map((record, idx) => {
                const isTop3 = idx < 3;
                const ratio = record.score / record.total;

                return (
                  <li
                    key={`${record.nickname}-${record.timestamp}-${idx}`}
                    className={`grid grid-cols-12 items-center gap-2 rounded-xl border-2 px-3 py-3 transition ${
                      isTop3
                        ? RANK_ROW_HIGHLIGHT[idx]
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="col-span-1">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${
                          isTop3
                            ? RANK_STYLE[idx]
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </div>

                    <div className="col-span-11 flex flex-col gap-1 sm:col-span-3">
                      <span className="truncate text-base font-bold text-slate-900">
                        {record.nickname}
                      </span>
                      <span className="text-xs text-slate-500 sm:hidden">
                        {record.category} · {formatDate(record.timestamp)}
                      </span>
                    </div>

                    <div className="col-span-6 sm:col-span-3 sm:text-center">
                      <span className="text-lg font-bold text-indigo-600">
                        {record.score}
                        <span className="text-sm font-medium text-slate-400">
                          {' '}
                          / {record.total}
                        </span>
                      </span>
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        ({Math.round(ratio * 100)}%)
                      </span>
                    </div>

                    <div className="col-span-6 hidden text-sm text-slate-700 sm:block">
                      {record.category}
                    </div>

                    <div className="col-span-2 hidden text-right text-xs text-slate-500 sm:block">
                      {formatDate(record.timestamp)}
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        <button
          type="button"
          onClick={goHome}
          className="mt-8 min-h-12 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 active:scale-[0.99]"
        >
          ← 홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
