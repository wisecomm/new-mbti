import { Suspense } from "react";
import { SignInButtons } from "@/features/auth";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">MBTI 테스트</h1>
        <p className="mt-2 text-zinc-500">로그인하고 나의 성격 유형을 확인하세요</p>
      </div>
      <Suspense>
        <SignIn searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SignIn({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next, error } = await searchParams;
  return (
    <>
      {error && <p className="text-sm text-red-600">로그인에 실패했어요. 다시 시도해 주세요.</p>}
      <SignInButtons next={typeof next === "string" ? next : null} />
    </>
  );
}
