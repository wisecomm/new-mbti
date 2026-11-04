// Run signed in: control-mbti.mjs run .claude/skills/verify/journeys/sign-out.mjs
import { expect } from "playwright/test";

export default async function journey({ page, step, shot, appUrl, email }) {
  await step("/me shows the signed-in email", async () => {
    await page.goto("/me");
    await expect(page.getByText(email)).toBeVisible();
    await shot("signed-in");
  });

  await step("로그아웃 lands on / as a fresh guest", async () => {
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(`${appUrl}/`);
    await expect(page.getByText("Guest님")).toBeVisible();
    await shot("signed-out");
  });
}
