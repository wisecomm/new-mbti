import type { AxisScores } from "@/features/personality";
import { QUESTIONS, type Answer, type Answers } from "./questions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Submission = { submissionId: string; answers: Answers };

/**
 * Boundary parse of the submitted form: `submissionId` plus one field per question id.
 * Returns null unless the id is a uuid and every question has exactly one answer in 1..5.
 */
export function parseSubmission(form: FormData): Submission | null {
  const submissionId = form.get("submissionId");
  if (typeof submissionId !== "string" || !UUID.test(submissionId)) return null;

  const answers: Answers = {};
  for (const q of QUESTIONS) {
    const values = form.getAll(q.id);
    if (values.length !== 1) return null;
    const n = Number(values[0]);
    if (!Number.isInteger(n) || n < 1 || n > 5) return null;
    answers[q.id] = n as Answer;
  }
  return { submissionId, answers };
}

/** Pure. Per axis: sum((answer - 3) * pole) / (2 * questionsOnAxis) * 100, rounded. Lands in [-100, 100]. */
export function scoreAnswers(answers: Answers): AxisScores {
  const sum: AxisScores = { ei: 0, sn: 0, tf: 0, jp: 0 };
  const count: AxisScores = { ei: 0, sn: 0, tf: 0, jp: 0 };
  for (const q of QUESTIONS) {
    sum[q.axis] += (answers[q.id] - 3) * q.pole;
    count[q.axis] += 1;
  }
  const scale = (axis: keyof AxisScores) =>
    count[axis] === 0 ? 0 : Math.round((sum[axis] / (2 * count[axis])) * 100);
  return { ei: scale("ei"), sn: scale("sn"), tf: scale("tf"), jp: scale("jp") };
}
