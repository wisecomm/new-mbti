import Link from "next/link";
import { Suspense } from "react";
import { listResults } from "@/features/personality";
import { Card } from "@/components/Card";

export default function ResultsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">기록</h1>
      <Suspense fallback={<p className="text-zinc-400">불러오는 중...</p>}>
        <ResultList />
      </Suspense>
    </>
  );
}

async function ResultList() {
  const results = await listResults();
  if (results.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-sm text-zinc-500">아직 저장된 결과가 없어요.</p>
        <Link href="/test" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white">
          테스트 시작하기
        </Link>
      </Card>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {results.map((r) => (
        <li key={r.id}>
          <Link href={`/results/${r.id}`} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
            <span className="text-xl font-bold tracking-widest">{r.type}</span>
            <span className="text-xs text-zinc-400">{r.createdAt.toLocaleDateString("ko-KR")}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
