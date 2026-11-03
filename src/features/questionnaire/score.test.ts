import { describe, expect, it } from "vitest";
import { QUESTIONS, type Answer, type Answers } from "./questions";
import { parseSubmission, scoreAnswers } from "./score";

const ID = "3f2b8c1e-5d4a-4b7e-9c2f-1a2b3c4d5e6f";

function allAnswers(pick: (q: (typeof QUESTIONS)[number]) => Answer): Answers {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, pick(q)]));
}

function formOf(entries: Record<string, string>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(entries)) form.append(k, v);
  return form;
}

describe("scoreAnswers", () => {
  it("scores all-neutral answers as 0 on every axis", () => {
    expect(scoreAnswers(allAnswers(() => 3))).toEqual({ ei: 0, sn: 0, tf: 0, jp: 0 });
  });

  it("reaches +100 when every answer fully agrees with the first pole", () => {
    expect(scoreAnswers(allAnswers((q) => (q.pole === 1 ? 5 : 1)))).toEqual({ ei: 100, sn: 100, tf: 100, jp: 100 });
  });

  it("reaches -100 when every answer fully agrees with the second pole", () => {
    expect(scoreAnswers(allAnswers((q) => (q.pole === 1 ? 1 : 5)))).toEqual({ ei: -100, sn: -100, tf: -100, jp: -100 });
  });

  it("scores axes independently", () => {
    const scores = scoreAnswers(allAnswers((q) => (q.axis === "ei" ? (q.pole === 1 ? 5 : 1) : 3)));
    expect(scores).toEqual({ ei: 100, sn: 0, tf: 0, jp: 0 });
  });
});

describe("parseSubmission", () => {
  const complete = { submissionId: ID, ...Object.fromEntries(QUESTIONS.map((q) => [q.id, "4"])) };

  it("accepts a complete submission", () => {
    const parsed = parseSubmission(formOf(complete));
    expect(parsed?.submissionId).toBe(ID);
    expect(Object.keys(parsed!.answers)).toHaveLength(QUESTIONS.length);
  });

  it("rejects a missing answer", () => {
    const rest = Object.fromEntries(Object.entries(complete).filter(([k]) => k !== QUESTIONS[0].id));
    expect(parseSubmission(formOf(rest))).toBeNull();
  });

  it("rejects out-of-range answers", () => {
    expect(parseSubmission(formOf({ ...complete, [QUESTIONS[0].id]: "6" }))).toBeNull();
  });

  it("rejects a non-uuid submissionId", () => {
    expect(parseSubmission(formOf({ ...complete, submissionId: "abc" }))).toBeNull();
  });
});
