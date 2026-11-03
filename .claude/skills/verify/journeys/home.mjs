// Run signed in: control-mbti.mjs run .claude/skills/verify/journeys/home.mjs
import { expect } from "playwright/test";

export default async function journey({ page, step, shot, db, appUrl }) {
  await step("fixture: no results for me", () => db.clear());

  await step("empty home invites the first test", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "아직 결과가 없어요" })).toBeVisible();
    await shot("home-empty");
    await page.getByRole("link", { name: "테스트 시작하기" }).click();
    await expect(page).toHaveURL(`${appUrl}/test`);
  });

  await step("fixture: an older INTP and a newer ENFJ result", async () => {
    await db.insert(undefined, { ei: -30, sn: -30, tf: 30, jp: -30 });
    await new Promise((r) => setTimeout(r, 50));
    await db.insert(undefined, { ei: 30, sn: -30, tf: -30, jp: 30 });
  });

  await step("home shows the latest result and offers a retake", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ENFJ");
    await expect(page.getByRole("link", { name: "다시 테스트하기" })).toBeVisible();
    await shot("home-latest");
  });
}
