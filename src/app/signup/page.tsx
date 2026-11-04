import Link from "next/link";
import { Suspense } from "react";
import { EmailAuthForm } from "@/features/auth";
import { Card } from "@/components/Card";

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <main className="flex flex-1 flex-col justify-center gap-6 px-5 py-10">
      <Link href="/" className="text-sm text-zinc-500">
        ← 홈으로
      </Link>
      <div>
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="mt-2 text-zinc-500">이메일로 가입하고 나의 성격 유형을 확인하세요</p>
      </div>
      <Card>
        <Suspense>
          <SignUp searchParams={searchParams} />
        </Suspense>
      </Card>
    </main>
  );
}

async function SignUp({ searchParams }: Pick<PageProps<"/signup">, "searchParams">) {
  const { next } = await searchParams;
  return <EmailAuthForm mode="signup" next={typeof next === "string" ? next : null} />;
}
