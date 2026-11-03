import Link from "next/link";
import { Suspense } from "react";
import { getLatestResult, ResultView } from "@/features/personality";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-zinc-400">불러오는 중...</p>}>
      <LatestResult />
    </Suspense>
  );
}

async function LatestResult() {
  const latest = await getLatestResult();

  return (
    <div className="flex w-full flex-col items-center gap-10">
      {latest ? (
        <ResultView result={latest} />
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold">아직 결과가 없어요</h1>
          <p className="mt-2 text-zinc-500">20개 질문에 답하고 나의 MBTI를 확인해 보세요.</p>
        </div>
      )}
      <Link href="/test" className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white">
        {latest ? "다시 테스트하기" : "테스트 시작하기"}
      </Link>
    </div>
  );
}
