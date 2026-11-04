import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getResult, ResultView } from "@/features/personality";
import { Card } from "@/components/Card";

export default function ResultPage({ params }: PageProps<"/results/[id]">) {
  return (
    <>
      <Suspense fallback={<p className="text-zinc-400">불러오는 중...</p>}>
        <Result params={params} />
      </Suspense>
      <Link href="/results" className="text-center text-sm text-zinc-500 underline">
        기록으로
      </Link>
    </>
  );
}

async function Result({ params }: Pick<PageProps<"/results/[id]">, "params">) {
  const result = await getResult((await params).id);
  if (!result) notFound();
  return (
    <Card>
      <ResultView result={result} />
    </Card>
  );
}
