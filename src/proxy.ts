import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isPublicPath, loginPath } from "@/features/auth/edge";

/** Optimistic gate only. The real check is requireUser() next to the data. */
export async function proxy(request: NextRequest) {
  const { response, signedIn } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  if (signedIn || isPublicPath(pathname)) return response;

  const redirect = NextResponse.redirect(new URL(loginPath(pathname + search), request.url));
  // Keep any cookies updateSession refreshed or cleared.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
