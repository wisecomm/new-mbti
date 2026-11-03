import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getResult, ResultView } from "@/features/personality";

export default function ResultPage({ params }: PageProps<"/results/[id]">) {
  return (
    <div className="flex w-full flex-col items-center gap-10">
      <Suspense fallback={<p className="text-zinc-400">불러오는 중...</p>}>
        <Result params={params} />
      </Suspense>
      <Link href="/" className="text-sm text-zinc-500 underline">
        홈으로
      </Link>
    </div>
  );
}

async function Result({ params }: Pick<PageProps<"/results/[id]">, "params">) {
  const result = await getResult((await params).id);
  if (!result) notFound();
  return <ResultView result={result} />;
}
