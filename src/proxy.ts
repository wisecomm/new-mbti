import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isPublicPath } from "@/features/auth/edge";

/** Keeps the session fresh and gives every visitor a guest session; the real check is requireUser(). */
export async function proxy(request: NextRequest) {
  const { response } = await updateSession(request, { createGuest: !isPublicPath(request.nextUrl.pathname) });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
