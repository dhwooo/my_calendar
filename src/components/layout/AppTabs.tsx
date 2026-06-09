"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookText,
  CalendarDays,
  MessageCircle,
  ScaleIcon,
  Target,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: typeof CalendarDays;
};

const TABS: Tab[] = [
  { href: "/calendar", label: "대시보드", icon: CalendarDays },
  { href: "/wiki", label: "위키", icon: BookText },
  { href: "/goals", label: "목표", icon: Target },
  { href: "/weight", label: "체중", icon: ScaleIcon },
  { href: "/assets", label: "자산", icon: Wallet },
  { href: "/board", label: "게시판", icon: MessageCircle },
];

export function DesktopTabs() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 rounded-xl bg-bg-muted/60 p-1 md:flex">
      {TABS.map((t) => {
        const active = pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition",
              active
                ? "bg-bg text-fg shadow-sm"
                : "text-fg-muted hover:text-fg",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-bg/85 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-6">
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5",
                active ? "text-fg" : "text-fg-subtle",
              )}
            >
              <t.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
