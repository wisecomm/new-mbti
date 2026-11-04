import Link from "next/link";
import { Suspense } from "react";
import { EmailAuthForm, SignInButtons } from "@/features/auth";
import { Card } from "@/components/Card";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 flex-col justify-center gap-6 px-5 py-10">
      <Link href="/" className="text-sm text-zinc-500">
        ← 홈으로
      </Link>
      <div>
        <h1 className="text-2xl font-bold">MBTI 테스트</h1>
        <p className="mt-2 text-zinc-500">로그인하고 나의 성격 유형을 확인하세요</p>
      </div>
      <Card className="flex flex-col gap-4">
        <Suspense>
          <SignIn searchParams={searchParams} />
        </Suspense>
      </Card>
    </main>
  );
}

async function SignIn({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : null;
  return (
    <>
      {error && <p className="text-sm text-red-600">로그인에 실패했어요. 다시 시도해 주세요.</p>}
      <SignInButtons next={nextPath} />
      <div className="flex w-full items-center gap-3 text-sm text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        또는
        <span className="h-px flex-1 bg-zinc-200" />
      </div>
      <EmailAuthForm mode="signin" next={nextPath} />
    </>
  );
}
