// Run anonymously: control-mbti.mjs run .claude/skills/verify/journeys/email-auth.mjs --anon
import { randomBytes } from "node:crypto";
import { expect } from "playwright/test";

export default async function journey({ page, step, shot, appUrl }) {
  const email = `verify-signup-${Date.now()}@example.test`;
  const password = randomBytes(12).toString("base64url");

  const submit = async (path, pw, name) => {
    await page.goto(path);
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill(pw);
    await page.getByRole("button", { name, exact: true }).click();
  };

  await step("sign-up with a fresh email lands on /test signed in", async () => {
    await submit("/signup?next=%2Ftest", password, "회원가입");
    await expect(page).toHaveURL(`${appUrl}/test`);
    await page.goto("/me");
    await expect(page.getByText(email)).toBeVisible();
    await shot("signed-up");
    return email;
  });

  await step("로그아웃 returns to /", async () => {
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(`${appUrl}/`);
  });

  await step("wrong password shows the invalid-credentials message and keeps the email", async () => {
    await submit("/login", `${password}-wrong`, "로그인");
    await expect(page.getByText("이메일 또는 비밀번호가 올바르지 않아요.")).toBeVisible();
    await expect(page.getByLabel("이메일")).toHaveValue(email);
    await shot("wrong-password");
  });

  await step("correct password lands on / signed in", async () => {
    await page.getByLabel("비밀번호").fill(password);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await expect(page).toHaveURL(`${appUrl}/`);
    await page.goto("/me");
    await expect(page.getByText(email)).toBeVisible();
    await shot("signed-in");
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(`${appUrl}/`);
  });

  await step("signing up the same email again shows the already-registered message", async () => {
    await submit("/signup", password, "회원가입");
    await expect(page.getByText("이미 가입된 이메일이에요.")).toBeVisible();
    await shot("already-registered");
  });

  await step("short password shows the parse error and stays on /signup", async () => {
    await submit("/signup", "12345", "회원가입");
    await expect(page.getByText("비밀번호는 6자 이상이어야 해요.")).toBeVisible();
    await expect(page).toHaveURL(`${appUrl}/signup`);
    await shot("short-password");
  });
}
