// Run signed in: control-mbti.mjs run .claude/skills/verify/journeys/sign-out.mjs
import { expect } from "playwright/test";

export default async function journey({ page, step, shot, appUrl, email }) {
  await step("signed-in header shows the user's email", async () => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByText(email)).toBeVisible();
    await shot("signed-in");
  });

  await step("로그아웃 returns to /login", async () => {
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(`${appUrl}/login`);
  });

  await step("session is gone: / redirects to /login again", async () => {
    await page.goto("/");
    await expect(page).toHaveURL(`${appUrl}/login`);
    await shot("signed-out");
  });
}
