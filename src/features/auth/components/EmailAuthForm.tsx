"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signInWithEmail, signUpWithEmail } from "../actions";
import type { EmailAuthState } from "../credentials";

type Mode = "signin" | "signup";

const MODES: Record<
  Mode,
  {
    action: typeof signInWithEmail;
    submit: string;
    pending: string;
    passwordAutoComplete: "current-password" | "new-password";
    switchText: string;
    switchLabel: string;
    switchRoute: "/login" | "/signup";
  }
> = {
  signin: {
    action: signInWithEmail,
    submit: "로그인",
    pending: "로그인 중…",
    passwordAutoComplete: "current-password",
    switchText: "계정이 없나요?",
    switchLabel: "회원가입",
    switchRoute: "/signup",
  },
  signup: {
    action: signUpWithEmail,
    submit: "회원가입",
    pending: "가입 중…",
    passwordAutoComplete: "new-password",
    switchText: "이미 계정이 있나요?",
    switchLabel: "로그인",
    switchRoute: "/login",
  },
};

const INPUT = "w-full rounded-lg border border-zinc-300 px-4 py-3";

export function EmailAuthForm({ mode, next }: { mode: Mode; next: string | null }) {
  const m = MODES[mode];
  const [state, formAction, pending] = useActionState<EmailAuthState, FormData>(m.action, { status: "idle" });
  const switchHref = next ? `${m.switchRoute}?next=${encodeURIComponent(next)}` : m.switchRoute;

  if (state.status === "check-email") {
    return (
      <p className="w-full text-center text-sm text-zinc-700">
        {state.email}로 확인 메일을 보냈어요. 메일의 링크를 눌러 가입을 마쳐 주세요.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? ""} />
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          이메일
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            defaultValue={state.status === "error" ? state.email : ""}
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          비밀번호
          <input
            type="password"
            name="password"
            autoComplete={m.passwordAutoComplete}
            required
            className={INPUT}
          />
        </label>
        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {pending ? m.pending : m.submit}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-500">
        {m.switchText}{" "}
        <Link href={switchHref} className="font-medium text-zinc-900 underline">
          {m.switchLabel}
        </Link>
      </p>
    </div>
  );
}
