import { describe, expect, it } from "vitest";
import { isPublicPath, safeNextPath } from "./edge";

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

describe("isPublicPath", () => {
  it.each(["/login", "/signup", "/auth/callback"])("treats %s as public", (p) => {
    expect(isPublicPath(p)).toBe(true);
  });

  it.each(["/", "/test", "/loginx"])("treats %s as a guest page", (p) => {
    expect(isPublicPath(p)).toBe(false);
  });
});
