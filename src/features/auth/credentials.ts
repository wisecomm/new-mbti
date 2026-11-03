import { safeNextPath } from "./edge";

export type EmailAuthState =
  | { status: "idle" }
  | { status: "error"; message: string; email: string }
  | { status: "check-email"; email: string };

// Mirrors supabase/config.toml minimum_password_length.
const MIN_PASSWORD_LENGTH = 6;

export function parseCredentials(
  form: FormData,
): { email: string; password: string; next: string } | { error: string; email: string } {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "이메일 형식이 올바르지 않아요.", email };
  if (password.length < MIN_PASSWORD_LENGTH)
    return { error: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`, email };
  return { email, password, next: safeNextPath(String(form.get("next") ?? "")) };
}

const GENERIC_MESSAGE = "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않아요.",
  email_not_confirmed: "이메일 인증이 아직 끝나지 않았어요. 받은 메일의 링크를 눌러 주세요.",
  user_already_exists: "이미 가입된 이메일이에요. 로그인해 주세요.",
  email_exists: "이미 가입된 이메일이에요. 로그인해 주세요.",
  weak_password: "비밀번호가 너무 쉬워요. 더 복잡한 비밀번호를 사용해 주세요.",
  email_address_invalid: "사용할 수 없는 이메일 주소예요.",
  over_email_send_rate_limit: "메일을 너무 자주 보냈어요. 잠시 후 다시 시도해 주세요.",
  over_request_rate_limit: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
  signup_disabled: "지금은 회원가입을 받지 않아요.",
  email_provider_disabled: "이메일 로그인을 사용할 수 없어요.",
};

/** Maps a Supabase auth error code to the message shown to the user. */
export function authErrorMessage(code: string | undefined): string {
  return (code && AUTH_ERROR_MESSAGES[code]) || GENERIC_MESSAGE;
}
