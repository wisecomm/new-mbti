"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./edge";

export type OAuthProvider = "google" | "apple";

/** Bound per button: <form action={signIn.bind(null, "google", next)}>. */
export async function signIn(provider: OAuthProvider, next: string | null): Promise<never> {
  const supabase = await createClient();
  const callback = new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL);
  callback.searchParams.set("next", safeNextPath(next));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
