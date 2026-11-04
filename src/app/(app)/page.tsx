import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/features/auth";
import { getLatestResult, ResultView } from "@/features/personality";
import { Card } from "@/components/Card";

const FEATURES = [
  { emoji: "🧠", title: "MBTI 테스트", subtitle: "20문항 · 3분", href: "/test" },
  { emoji: "📊", title: "내 결과", subtitle: "지난 결과 보기", href: "/results" },
  { emoji: "📸", title: "얼굴로 예측", subtitle: "곧 출시", href: null },
] as const;

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<p className="text-zinc-400">불러오는 중...</p>}>
        <Welcome />
      </Suspense>
      <div className="grid grid-cols-3 gap-3">
        {FEATURES.map((f) => {
          const body = (
            <>
              <span className="text-2xl">{f.emoji}</span>
              <span className="mt-2 block text-sm font-bold">{f.title}</span>
              <span className="mt-0.5 block text-xs text-zinc-400">{f.subtitle}</span>
            </>
          );
          return f.href ? (
            <Link key={f.title} href={f.href} className="rounded-2xl bg-white p-4 shadow-sm">
              {body}
            </Link>
          ) : (
            <div key={f.title} aria-disabled className="rounded-2xl bg-white p-4 opacity-60 shadow-sm">
              {body}
            </div>
          );
        })}
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold">최근 결과</h2>
        <Suspense fallback={<p className="text-zinc-400">불러오는 중...</p>}>
          <LatestResult />
        </Suspense>
      </section>
    </>
  );
}

async function Welcome() {
  const user = await requireUser();
  const name = user.isAnonymous ? "Guest" : (user.email?.split("@")[0] ?? "회원");
  return (
    <>
      <div>
        <p className="text-sm text-zinc-500">안녕하세요</p>
        <p className="text-2xl font-bold">{name}님</p>
      </div>
      {user.isAnonymous && (
        <Card>
          <p className="text-sm font-bold">가입하면 결과를 계정에 보관할 수 있어요</p>
          <p className="mt-1 text-xs text-zinc-500">테스트는 로그인 없이도 할 수 있어요.</p>
          <Link
            href="/signup"
            className="mt-4 block rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white"
          >
            3초 만에 가입하기
          </Link>
        </Card>
      )}
    </>
  );
}

async function LatestResult() {
  const latest = await getLatestResult();
  return (
    <Card className="flex flex-col items-center gap-6">
      {latest ? (
        <>
          <ResultView result={latest} />
          <Link href="/test" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white">
            다시 테스트하기
          </Link>
        </>
      ) : (
        <>
          <div className="text-center">
            <h2 className="text-lg font-bold">아직 결과가 없어요</h2>
            <p className="mt-1 text-sm text-zinc-500">20개 질문에 답하고 나의 MBTI를 확인해 보세요.</p>
          </div>
          <Link href="/test" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white">
            테스트 시작하기
          </Link>
        </>
      )}
    </Card>
  );
}
