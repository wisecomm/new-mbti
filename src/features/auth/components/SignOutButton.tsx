import { signOut } from "../actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-900">
        로그아웃
      </button>
    </form>
  );
}
