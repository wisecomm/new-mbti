import { Suspense } from "react";
import { requireUser } from "@/features/auth";
import { QuestionnaireForm } from "@/features/questionnaire";

export default function TestPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">MBTI 테스트</h1>
      <Suspense fallback={<p className="text-zinc-400">불러오는 중...</p>}>
        <Questionnaire />
      </Suspense>
    </>
  );
}

async function Questionnaire() {
  // Reading the session makes this request-time, so each visit gets a fresh submissionId.
  await requireUser();
  return <QuestionnaireForm submissionId={crypto.randomUUID()} />;
}
