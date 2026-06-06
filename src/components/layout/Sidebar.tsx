"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import useSWR from "swr";
import { Plus, RefreshCw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  daysBetween,
  fmt,
  isSameDay,
  isSameMonth,
  monthGridRange,
} from "@/lib/date";

type Props = {
  anchor: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  onCreate: () => void;
  onSync: () => void;
  syncing?: boolean;
  onRefreshIcal?: () => Promise<void> | void;
};

type StatusResp = { connected: boolean };

export function Sidebar({
  anchor,
  selected,
  onSelect,
  onCreate,
  onSync,
  syncing,
  onRefreshIcal,
}: Props) {
  const days = daysBetween(monthGridRange(anchor));
  const weekHeader = ["월", "화", "수", "목", "금", "토", "일"];
  const today = new Date();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: status } = useSWR<StatusResp>("/api/calendar/google-status");
  const connected = !!status?.connected;
  const { data: profile } = useSWR<{ user: { icalUrl: string | null } }>(
    "/api/profile",
  );
  const hasIcal = !!profile?.user?.icalUrl;

  return (
    <aside className="relative z-10 flex h-full w-[260px] shrink-0 flex-col gap-6 border-r border-border/60 bg-bg-subtle/30 px-5 py-6 backdrop-blur-sm">
      <Button
        onClick={onCreate}
        className="h-10 w-full justify-center gap-2 rounded-xl"
      >
        <Plus className="h-4 w-4" />
        새 이벤트
      </Button>

      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-[13px] font-medium tracking-tight text-fg">
            {fmt.monthYear(anchor)}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-y-1.5 text-center">
          {weekHeader.map((w, i) => (
            <span
              key={w}
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider",
                i === 5 || i === 6 ? "text-fg-subtle/80" : "text-fg-subtle",
              )}
            >
              {w}
            </span>
          ))}
          {days.map((d) => {
            const isSel = isSameDay(d, selected);
            const isToday = isSameDay(d, today);
            const muted = !isSameMonth(d, anchor);
            return (
              <button
                key={d.toISOString()}
                onClick={() => onSelect(d)}
                className={cn(
                  "mx-auto flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] transition",
                  muted && "text-fg-subtle",
                  !muted && !isSel && !isToday && "text-fg hover:bg-bg-muted",
                  isToday && !isSel && "text-accent ring-1 ring-inset ring-accent/40",
                  isSel && "bg-accent text-accent-fg",
                )}
              >
                {fmt.day(d)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {hasIcal && onRefreshIcal && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[12px] font-medium text-fg">
                iCal 구독
              </span>
              <span className="font-mono text-[10px] text-emerald-600">
                ● 활성
              </span>
            </div>
            <Button
              variant="outline"
              className="mt-2 h-8 w-full justify-center gap-2 rounded-lg text-[12px]"
              onClick={async () => {
                setRefreshing(true);
                try {
                  await onRefreshIcal();
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
              />
              {refreshing ? "가져오는 중..." : "지금 새로고침"}
            </Button>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-fg-subtle">
              자동: 5분마다. 즉시 반영하려면 이 버튼.
            </p>
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl border p-4",
            connected
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-border bg-bg-subtle",
          )}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-medium text-fg">
              Google Calendar
            </span>
            <span
              className={cn(
                "font-mono text-[10px]",
                connected ? "text-emerald-600" : "text-fg-subtle",
              )}
            >
              {connected ? "● 연결됨" : "○ 미연결"}
            </span>
          </div>
          {connected ? (
            <Button
              variant="outline"
              className="mt-2 h-8 w-full justify-center gap-2 rounded-lg text-[12px]"
              onClick={onSync}
              disabled={syncing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
              {syncing ? "동기화 중..." : "동기화"}
            </Button>
          ) : (
            <Button
              variant="default"
              className="mt-2 h-8 w-full justify-center gap-2 rounded-lg text-[12px]"
              onClick={async () => {
                const res = await signIn("google", {
                  callbackUrl: "/calendar?connected=1",
                  redirect: false,
                });
                if (res?.error) {
                  alert(
                    ".env의 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET이 비어 있어요.\n\n1. Google Cloud Console에서 OAuth 2.0 클라이언트 발급\n2. Authorized redirect URI: " +
                      window.location.origin +
                      "/api/auth/callback/google\n3. .env에 키 추가 후 dev 서버 재시작",
                  );
                } else if (res?.url) {
                  window.location.href = res.url;
                }
              }}
            >
              <Link2 className="h-3.5 w-3.5" />
              Google 연결
            </Button>
          )}
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-fg-subtle">
            {connected
              ? "현재 보기 범위의 이벤트만 가져오며 로컬 변경은 자동 push 됩니다."
              : "Google 계정과 연결하면 양방향 동기화가 활성화됩니다."}
          </p>
        </div>
      </div>
    </aside>
  );
}
