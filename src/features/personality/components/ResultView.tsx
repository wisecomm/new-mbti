import { AXES, AXIS_POLES, type MbtiResult } from "../model";

export function ResultView({ result }: { result: MbtiResult }) {
  return (
    <section className="flex w-full flex-col items-center gap-8">
      <div className="text-center">
        <p className="text-sm text-zinc-500">당신의 MBTI는</p>
        <h1 className="mt-2 text-6xl font-bold tracking-widest">{result.type}</h1>
      </div>

      <ul className="flex w-full flex-col gap-5">
        {AXES.map((axis) => {
          const score = result.scores[axis];
          const [left, right] = AXIS_POLES[axis];
          // 0..100 where 0 is fully the left pole.
          const position = (100 - score) / 2;
          return (
            <li key={axis} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm font-medium">
                <span className={score >= 0 ? "text-zinc-900" : "text-zinc-300"}>{left}</span>
                <span className={score < 0 ? "text-zinc-900" : "text-zinc-300"}>{right}</span>
              </div>
              <div className="relative h-2 rounded-full bg-zinc-200">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                  style={{ left: `${position}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-zinc-400">{result.createdAt.toLocaleDateString("ko-KR")}</p>
    </section>
  );
}
