"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, History, House, User, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "홈", icon: House },
  { href: "/test", label: "테스트", icon: ClipboardList },
  { href: "/results", label: "기록", icon: History },
  { href: "/me", label: "MY", icon: User },
];

function isActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="탭"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto grid max-w-[520px] grid-cols-4 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-semibold text-primary" : "text-zinc-400"}`}
          >
            <Icon aria-hidden size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
