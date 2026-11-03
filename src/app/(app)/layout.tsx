import Link from "next/link";
import { Suspense } from "react";
import { requireUser, SignOutButton } from "@/features/auth";

/**
 * Shell for every signed-in screen. The session read sits behind Suspense (Cache Components
 * forbids a top-level await here); pages and data functions do their own requireUser() check.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <Link href="/" className="font-bold">
          MBTI
        </Link>
        <Suspense>
          <UserMenu />
        </Suspense>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 py-10">{children}</main>
    </>
  );
}

async function UserMenu() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-3 text-sm text-zinc-500">
      <span>{user.email}</span>
      <SignOutButton />
    </div>
  );
}
