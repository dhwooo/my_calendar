"use client";

import * as React from "react";
import { Bell, BellRing, Inbox } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const push = usePushNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="알림"
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-full text-fg-muted transition hover:bg-bg-muted hover:text-fg",
          )}
        >
          {push.subscribed ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {push.subscribed && (
            <span className="absolute right-1.5 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px] p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[13px] font-medium text-fg">알림</span>
          <span
            className={cn(
              "font-mono text-[10px]",
              push.subscribed ? "text-emerald-600" : "text-fg-subtle",
            )}
          >
            {push.status === "unsupported"
              ? "미지원"
              : push.subscribed
                ? "● 활성"
                : "○ 비활성"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 px-3 py-6 text-center">
          <Inbox className="h-5 w-5 text-fg-subtle" />
          <p className="text-[12px] text-fg-muted">새 알림이 없어요</p>
        </div>

        {push.status !== "unsupported" && (
          <div className="mt-3 flex gap-1.5">
            {push.subscribed ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-lg text-[11px]"
                  onClick={() => push.disable()}
                >
                  알림 끄기
                </Button>
                <Button
                  size="sm"
                  className="flex-1 rounded-lg text-[11px]"
                  onClick={() => push.sendTest()}
                >
                  테스트
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="w-full rounded-lg text-[11px]"
                onClick={() => push.enable()}
              >
                알림 허용
              </Button>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
