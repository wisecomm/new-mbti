// Run signed in: control-mbti.mjs run .claude/skills/verify/journeys/questionnaire.mjs
import { expect } from "playwright/test";

const QUESTION_COUNT = 20;

export default async function journey({ page, step, shot, db, appUrl }) {
  const before = (await db.results()).length;

  await step(`test page shows ${QUESTION_COUNT} questions`, async () => {
    await page.goto("/test");
    await expect(page.getByRole("heading", { name: "MBTI 테스트" })).toBeVisible();
    await expect(page.getByRole("group")).toHaveCount(QUESTION_COUNT);
    await shot("test-page");
  });

  await step("submitting with no answers is blocked and saves nothing", async () => {
    await page.getByRole("button", { name: "결과 보기" }).click();
    await expect(page).toHaveURL(`${appUrl}/test`);
    expect((await db.results()).length).toBe(before);
  });

  await step("answer every question with 매우 그렇다", async () => {
    for (const group of await page.getByRole("group").all()) await group.getByText("매우 그렇다").click();
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(QUESTION_COUNT);
    await shot("answered");
  });

  let resultId;
  await step("double submit lands on one result page", async () => {
    // React queues the second submit and drops it after the first redirects, so this proves the
    // client path yields one result; it does not reach the server-side duplicate guard.
    await page.getByRole("button", { name: "결과 보기" }).evaluate((button) => {
      button.form.requestSubmit();
      button.form.requestSubmit();
    });
    await page.waitForURL(/\/results\/[0-9a-f-]{36}$/);
    resultId = page.url().split("/").pop();
    // All 20 answers at 5: each axis has 3 first-pole and 2 second-pole questions -> +20 -> ESTJ.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ESTJ");
    await shot("result");
    return resultId;
  });

  await step("exactly one new row, matching the page", async () => {
    await page.waitForTimeout(1000); // let a second in-flight submit finish before counting
    const rows = await db.results();
    expect(rows.length).toBe(before + 1);
    const row = rows[0];
    expect(row.id).toBe(resultId);
    expect(row).toMatchObject({ type: "ESTJ", method: "questionnaire", method_version: "v1", ei: 20, sn: 20, tf: 20, jp: 20 });
    return `row ${row.id} type ${row.type}`;
  });
}
