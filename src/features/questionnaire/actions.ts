"use server";
import { redirect } from "next/navigation";
import { saveResult } from "@/features/personality";
import { QUESTIONNAIRE_VERSION } from "./questions";
import { parseSubmission, scoreAnswers } from "./score";

export type SubmitState = { error: string } | null;

/** useActionState action. On success redirects to /results/<id>. */
export async function submitQuestionnaire(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  const parsed = parseSubmission(form);
  if (!parsed) return { error: "모든 문항에 답해 주세요." };

  const result = await saveResult(parsed.submissionId, {
    method: "questionnaire",
    methodVersion: QUESTIONNAIRE_VERSION,
    scores: scoreAnswers(parsed.answers),
  });
  redirect(`/results/${result.id}`);
}
