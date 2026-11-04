import Link from "next/link";
import { Suspense } from "react";
import { requireUser, SignOutButton } from "@/features/auth";
import { Card } from "@/components/Card";

export default function MePage() {
  return (
    <>
      <h1 className="text-2xl font-bold">MY</h1>
      <Suspense fallback={<p className="text-zinc-400">불러오는 중...</p>}>
        <Account />
      </Suspense>
    </>
  );
}

async function Account() {
  const user = await requireUser();
  if (!user.isAnonymous) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm">{user.email}</span>
        <SignOutButton />
      </Card>
    );
  }
  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm font-bold">게스트로 이용 중이에요</p>
      <div className="grid grid-cols-2 gap-3 text-center text-sm font-semibold">
        <Link href="/login" className="rounded-xl bg-primary py-3 text-white">
          로그인
        </Link>
        <Link href="/signup" className="rounded-xl border border-zinc-200 py-3">
          회원가입
        </Link>
      </div>
    </Card>
  );
}
