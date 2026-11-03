import { describe, expect, it } from "vitest";
import { isPublicPath, loginPath, safeNextPath } from "./edge";

describe("safeNextPath", () => {
  it.each(["/test", "/results/abc?x=1"])("keeps same-origin path %s", (p) => {
    expect(safeNextPath(p)).toBe(p);
  });

  it.each([null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "test"])(
    "rejects %s",
    (p) => {
      expect(safeNextPath(p)).toBe("/");
    },
  );
});

describe("loginPath", () => {
  it("omits next for the home page", () => {
    expect(loginPath("/")).toBe("/login");
  });

  it("encodes next", () => {
    expect(loginPath("/results/1?a=b")).toBe("/login?next=%2Fresults%2F1%3Fa%3Db");
  });
});

describe("isPublicPath", () => {
  it.each(["/login", "/signup", "/auth/callback"])("treats %s as public", (p) => {
    expect(isPublicPath(p)).toBe(true);
  });

  it.each(["/", "/test", "/loginx"])("treats %s as protected", (p) => {
    expect(isPublicPath(p)).toBe(false);
  });
});
