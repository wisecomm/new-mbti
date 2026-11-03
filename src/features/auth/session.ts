import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null };

/** The Data Access Layer check, memoized per request. Returns the verified user or redirects to /login. */
export const requireUser = cache(async (): Promise<SessionUser> => {
  // getClaims() checks token expiry against the clock, so keep it out of runtime prefetch prerenders.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { id: data.claims.sub, email: data.claims.email ?? null };
});
