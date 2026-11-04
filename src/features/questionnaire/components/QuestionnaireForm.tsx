"use client";
import { useActionState } from "react";
import { submitQuestionnaire, type SubmitState } from "../actions";
import { ANSWER_LABELS, QUESTIONS } from "../questions";

/** `submissionId` is minted by the server page so a double submit saves one result. */
export function QuestionnaireForm({ submissionId }: { submissionId: string }) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitQuestionnaire, null);

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <input type="hidden" name="submissionId" value={submissionId} />

      {QUESTIONS.map((q, i) => (
        <fieldset key={q.id} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
          <legend className="mb-3 font-medium">
            <span className="mr-2 text-zinc-400">{i + 1}.</span>
            {q.text}
          </legend>
          <div className="grid grid-cols-5 gap-2">
            {ANSWER_LABELS.map((label, idx) => (
              <label
                key={label}
                className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 p-2 text-center text-xs has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white"
              >
                <input type="radio" name={q.id} value={idx + 1} required className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "결과 계산 중..." : "결과 보기"}
      </button>
    </form>
  );
}
