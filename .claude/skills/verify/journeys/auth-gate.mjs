// Run anonymously: control-mbti.mjs run .claude/skills/verify/journeys/auth-gate.mjs --anon
import { expect } from "playwright/test";

export default async function journey({ page, step, shot, appUrl }) {
  await step("anonymous visitor to /test gets the questionnaire as a guest, no redirect", async () => {
    await page.goto("/test");
    await expect(page).toHaveURL(`${appUrl}/test`);
    await expect(page.getByRole("heading", { name: "MBTI 테스트" })).toBeVisible();
    await expect(page.getByRole("group")).toHaveCount(20);
    await shot("guest-test");
  });

  await step("/me shows the guest state with login and signup links", async () => {
    await page.goto("/me");
    await expect(page.getByText("게스트로 이용 중이에요")).toBeVisible();
    await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(page.getByRole("link", { name: "회원가입" })).toBeVisible();
    await shot("guest-me");
  });

  for (const [provider, name] of [
    ["google", "Google로 계속하기"],
    ["apple", "Apple로 계속하기"],
  ]) {
    await step(`${provider} button starts OAuth with the callback and next`, async () => {
      await page.goto("/login?next=%2Ftest");
      await expect(page.getByRole("heading", { name: "MBTI 테스트" })).toBeVisible();
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
