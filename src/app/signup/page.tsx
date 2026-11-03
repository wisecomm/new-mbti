import { Suspense } from "react";
import { EmailAuthForm } from "@/features/auth";

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">회원가입</h1>
        <p className="mt-2 text-zinc-500">이메일로 가입하고 나의 성격 유형을 확인하세요</p>
      </div>
      <Suspense>
        <SignUp searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SignUp({ searchParams }: Pick<PageProps<"/signup">, "searchParams">) {
  const { next } = await searchParams;
  return <EmailAuthForm mode="signup" next={typeof next === "string" ? next : null} />;
}
