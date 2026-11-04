// Run anonymously: control-mbti.mjs run .claude/skills/verify/journeys/guest-flow.mjs --anon
import { expect } from "playwright/test";

export default async function journey({ page, step, shot, appUrl }) {
  await step("guest home greets Guest님 and offers sign-up", async () => {
    await page.goto("/");
    await expect(page.getByText("Guest님")).toBeVisible();
    await expect(page.getByRole("link", { name: "3초 만에 가입하기" })).toBeVisible();
    await shot("guest-home");
  });

  await step("guest answers the questionnaire and lands on a result", async () => {
    await page.getByRole("navigation", { name: "탭" }).getByRole("link", { name: "테스트" }).click();
    await expect(page).toHaveURL(`${appUrl}/test`);
    // The questionnaire streams in behind Suspense; .all() does not wait for it.
    await expect(page.getByRole("group")).toHaveCount(20);
    for (const group of await page.getByRole("group").all()) await group.getByText("매우 그렇다").click();
    await page.getByRole("button", { name: "결과 보기" }).click();
    await page.waitForURL(/\/results\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ESTJ");
    await shot("guest-result");
    return page.url();
  });

  await step("기록 lists the guest's result and links to it", async () => {
    const resultUrl = page.url();
    await page.getByRole("navigation", { name: "탭" }).getByRole("link", { name: "기록" }).click();
    await expect(page).toHaveURL(`${appUrl}/results`);
    const items = page.getByRole("listitem");
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText("ESTJ");
    await shot("guest-results-list");
    await items.first().getByRole("link").click();
    await expect(page).toHaveURL(resultUrl);
  });
}
