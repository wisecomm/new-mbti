import { signOut } from "../actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold">
        로그아웃
      </button>
    </form>
  );
}
