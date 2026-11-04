// Pure and edge-safe: src/proxy.ts imports this, so it must never pull in server-only code.

const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Only same-origin relative paths survive; anything else becomes "/". Blocks open redirects via ?next=. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
