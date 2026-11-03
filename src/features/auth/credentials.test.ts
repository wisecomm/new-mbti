import { describe, expect, it } from "vitest";
import { authErrorMessage, parseCredentials } from "./credentials";

function form(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

describe("parseCredentials", () => {
  it("accepts a valid email and password", () => {
    expect(parseCredentials(form({ email: "a@b.co", password: "secret1", next: "/test" }))).toEqual({
      email: "a@b.co",
      password: "secret1",
      next: "/test",
    });
  });

  it("trims the email", () => {
    expect(parseCredentials(form({ email: "  a@b.co  ", password: "secret1" }))).toMatchObject({ email: "a@b.co" });
  });

  it("rejects a malformed email and keeps what was typed", () => {
    const result = parseCredentials(form({ email: "nope", password: "secret1" }));
    expect(result).toMatchObject({ email: "nope", error: expect.any(String) });
  });

  it("rejects a short password and keeps the email", () => {
    const result = parseCredentials(form({ email: "a@b.co", password: "12345" }));
    expect(result).toMatchObject({ email: "a@b.co", error: expect.any(String) });
  });

  it("replaces an unsafe next with /", () => {
    expect(parseCredentials(form({ email: "a@b.co", password: "secret1", next: "//evil.com" }))).toMatchObject({
      next: "/",
    });
  });
});

describe("authErrorMessage", () => {
  it("translates a known code", () => {
    expect(authErrorMessage("invalid_credentials")).toContain("이메일 또는 비밀번호");
  });

  it.each([undefined, "something_new"])("falls back for %s", (code) => {
    expect(authErrorMessage(code)).toBe(authErrorMessage("unmapped"));
    expect(authErrorMessage(code)).not.toBe(authErrorMessage("invalid_credentials"));
  });
});
