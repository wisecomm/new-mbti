"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./edge";
import { authErrorMessage, parseCredentials, type EmailAuthState } from "./credentials";

export type OAuthProvider = "google" | "apple";

function callbackUrl(next: string | null): string {
  const callback = new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL);
  callback.searchParams.set("next", safeNextPath(next));
  return callback.toString();
}

/** Bound per button: <form action={signIn.bind(null, "google", next)}>. */
export async function signIn(provider: OAuthProvider, next: string | null): Promise<never> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callbackUrl(next) },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signInWithEmail(_prev: EmailAuthState, form: FormData): Promise<EmailAuthState> {
  const parsed = parseCredentials(form);
  if ("error" in parsed) return { status: "error", message: parsed.error, email: parsed.email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.email, password: parsed.password });
  if (error) return { status: "error", message: authErrorMessage(error.code), email: parsed.email };
  redirect(parsed.next);
}

export async function signUpWithEmail(_prev: EmailAuthState, form: FormData): Promise<EmailAuthState> {
  const parsed = parseCredentials(form);
  if ("error" in parsed) return { status: "error", message: parsed.error, email: parsed.email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: { emailRedirectTo: callbackUrl(parsed.next) },
  });
  if (error) return { status: "error", message: authErrorMessage(error.code), email: parsed.email };
  // No session means the project requires email confirmation; the link lands on /auth/callback.
  if (data.session) redirect(parsed.next);
  return { status: "check-email", email: parsed.email };
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
