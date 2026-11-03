// Run anonymously: control-mbti.mjs run .claude/skills/verify/journeys/auth-gate.mjs --anon
import { expect } from "playwright/test";

export default async function journey({ page, step, shot, appUrl }) {
  await step("protected URL redirects to /login with next", async () => {
    await page.goto("/results/abc?x=1");
    await expect(page).toHaveURL(`${appUrl}/login?next=%2Fresults%2Fabc%3Fx%3D1`);
    await expect(page.getByRole("heading", { name: "MBTI 테스트" })).toBeVisible();
    await shot("login-page");
  });

  for (const [provider, name] of [
    ["google", "Google로 계속하기"],
    ["apple", "Apple로 계속하기"],
  ]) {
    await step(`${provider} button starts OAuth with the callback and next`, async () => {
      await page.goto("/login?next=%2Ftest");
      const authorize = page.waitForRequest((r) => r.url().includes("/auth/v1/authorize"));
      await page.getByRole("button", { name }).click();
      const url = new URL((await authorize).url());
      expect(url.searchParams.get("provider")).toBe(provider);
      const redirectTo = new URL(url.searchParams.get("redirect_to"));
      expect(redirectTo.origin + redirectTo.pathname).toBe(`${appUrl}/auth/callback`);
      expect(redirectTo.searchParams.get("next")).toBe("/test");
      return url.toString();
    });
  }

  await step("failed callback lands on /login with an error, never on ?next", async () => {
    await page.goto("/auth/callback?code=bogus&next=%2F%2Fevil.example");
    await expect(page).toHaveURL(`${appUrl}/login?error=oauth`);
    await expect(page.getByText("로그인에 실패했어요")).toBeVisible();
    await shot("callback-error");
  });
}
