// Run signed in: control-mbti.mjs run .claude/skills/verify/journeys/result-view.mjs
import { expect } from "playwright/test";

export default async function journey({ page, step, shot, db }) {
  let own;
  await step("fixture: one result for me (ISFJ), one for another user", async () => {
    own = await db.insert(undefined, { ei: -60, sn: 40, tf: -20, jp: 80 });
    return `own ${own.id}`;
  });
  const other = await db.insert("other", { ei: 50, sn: -50, tf: 50, jp: -50 });

  await step("my result page shows the stored type and axes", async () => {
    await page.goto(`/results/${own.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ISFJ");
    await expect(page.getByText("당신의 MBTI는")).toBeVisible();
    await expect(page.getByRole("list").getByRole("listitem")).toHaveCount(4);
    await shot("own-result");
  });

  // notFound() runs inside Suspense after streaming starts, so HTTP stays 200 (Next docs);
  // assert what the user sees plus the noindex tag Next adds.
  const expectNotFound = async () => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("404");
    await expect(page.getByText("This page could not be found.")).toBeVisible();
    await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
  };

  await step("another user's result shows the 404 screen and none of their data", async () => {
    await page.goto(`/results/${other.id}`);
    await expectNotFound();
    await expect(page.getByText(other.type, { exact: true })).toHaveCount(0);
    await shot("other-user-404");
  });

  await step("a malformed id shows the 404 screen", async () => {
    await page.goto("/results/not-a-uuid");
    await expectNotFound();
  });
}
