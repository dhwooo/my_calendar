"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ArrowLeft, LogOut, Menu, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { NotificationBell } from "@/components/ui/notification-bell";
import { DesktopTabs } from "@/components/layout/AppTabs";

type Props = {
  onOpenMobileNav?: () => void;
  showBack?: boolean;
};

export function TopBar({ onOpenMobileNav, showBack }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header
      className="sticky top-0 z-30 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border/60 bg-bg/75 px-3 backdrop-blur-xl sm:px-5"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* LEFT */}
      <div className="flex items-center gap-1 justify-self-start">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="뒤로"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {onOpenMobileNav && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="메뉴"
            onClick={onOpenMobileNav}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link
          href="/calendar"
          prefetch
          className="ml-1 flex items-center gap-2 transition hover:opacity-80"
        >
          <Logo size={22} />
          <span className="text-gradient text-gradient-animated text-[15px] font-semibold tracking-tight sm:text-[16px]">
            <span className="sm:hidden">Prv. CAL</span>
            <span className="hidden sm:inline">Private Calendar</span>
          </span>
        </Link>
      </div>

      {/* CENTER */}
      <div className="justify-self-center">
        <DesktopTabs />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1 justify-self-end">
        <ThemeToggle />
        <NotificationBell />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-9 items-center gap-2 rounded-full border border-border/70 bg-bg-subtle/70 pl-1 pr-3 text-left transition hover:border-fg/30 hover:bg-bg-muted"
                aria-label="계정 메뉴"
              >
                <Avatar name={user.name ?? user.email ?? "?"} src={user.image} size={28} />
                <span className="hidden text-[12px] font-medium text-fg sm:inline">
                  {user.name ?? user.email}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              <DropdownMenuLabel>
                <div className="text-fg">{user.name ?? "사용자"}</div>
                <div className="font-mono text-[11px] text-fg-subtle">
                  {user.email ?? `@${(user as { id?: string }).id ?? ""}`}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push("/profile")}>
                <User className="h-4 w-4 text-fg-muted" />
                프로필
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onSelect={() => signOut({ callbackUrl: "/sign-in" })}
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
