"use client";

import * as React from "react";
import { signIn, useSession } from "next-auth/react";
import useSWR from "swr";
import { Bell, BellOff, Camera, Link2, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DraggablePopup } from "@/components/ui/DraggablePopup";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export type Profile = {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string | null;
    icalUrl: string | null;
  };
  googleConnected: boolean;
};

const MAX_DIM = 512;

async function compress(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.86);
}

export function ProfileClient({
  initialProfile,
}: {
  initialProfile: Profile;
}) {
  const { update } = useSession();
  const { data, mutate } = useSWR<Profile>("/api/profile", {
    fallbackData: initialProfile,
    revalidateOnMount: false,
  });
  const push = usePushNotifications();
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (data?.user.name) setName(data.user.name);
  }, [data?.user.name]);

  const [icalUrl, setIcalUrl] = React.useState("");
  const [icalRefreshing, setIcalRefreshing] = React.useState(false);
  const [icalDiagLoading, setIcalDiagLoading] = React.useState(false);
  const [icalDiag, setIcalDiag] = React.useState<{
    step: string;
    [k: string]: unknown;
  } | null>(null);
  const [icalSaving, setIcalSaving] = React.useState(false);
  React.useEffect(() => {
    if (data?.user.icalUrl !== undefined) setIcalUrl(data.user.icalUrl ?? "");
  }, [data?.user.icalUrl]);

  async function saveIcalUrl(next: string | null) {
    setIcalSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icalUrl: next }),
    });
    setIcalSaving(false);
    await mutate();
  }

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    await mutate();
    await update();
  }

  async function uploadAvatar(file: File) {
    setSaving(true);
    const dataUrl = await compress(file);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: dataUrl }),
    });
    setSaving(false);
    await mutate();
    await update();
  }

  const user = data?.user;

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-10 anim-fade-in">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-gradient text-[32px] font-semibold tracking-tight sm:text-[40px]">
          프로필
        </h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          profile
        </span>
      </div>

      <div className="mb-5 flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-bg-subtle/40 p-8">
        <div className="relative">
          <Avatar name={user?.name} src={user?.image} size={104} />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={saving}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg shadow-md transition hover:bg-bg-muted"
            aria-label="사진 변경"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 text-fg-muted" />
            )}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
        </div>
        <div className="text-center">
          <div className="text-[18px] font-medium text-fg">
            {user?.name ?? "—"}
          </div>
          <div className="mt-1 font-mono text-[11px] text-fg-subtle">
            @{user?.username ?? "—"}
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-border/70 bg-bg-subtle/40 p-5">
        <label className="block text-[11px] font-medium text-fg-muted">
          이름
        </label>
        <div className="mt-2 flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl"
          />
          <Button
            onClick={saveName}
            disabled={saving || name === (user?.name ?? "")}
            className="h-11 rounded-xl"
          >
            저장
          </Button>
        </div>
      </div>

      {/* ICS subscribe (read-only) */}
      <div className="rounded-2xl border border-border/70 bg-bg-subtle/40 p-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[14px] font-medium text-fg">
            Google Calendar 자동 연동 (ICS)
          </span>
          <span
            className={
              data?.user.icalUrl
                ? "font-mono text-[10px] text-emerald-600"
                : "font-mono text-[10px] text-fg-subtle"
            }
          >
            {data?.user.icalUrl ? "● 구독 중" : "○ 미설정"}
          </span>
        </div>
        <p className="mb-3 font-mono text-[10px] leading-relaxed text-fg-subtle">
          Google Calendar → 설정 → 캘린더 통합 → <b>비공개 iCal 주소</b> 복사 후 붙여넣기.
          5분마다 자동 갱신되며 읽기 전용으로 캘린더에 표시됩니다.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            className="h-10 flex-1 rounded-xl text-[12px]"
          />
          <Button
            onClick={() => saveIcalUrl(icalUrl.trim() || null)}
            disabled={icalSaving || icalUrl === (data?.user.icalUrl ?? "")}
            className="h-10 rounded-xl"
          >
            저장
          </Button>
        </div>
        {data?.user.icalUrl && (
          <>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  setIcalRefreshing(true);
                  try {
                    await fetch(
                      `/api/calendar/ical?from=${new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString()}&to=${new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1).toISOString()}&refresh=1`,
                    );
                  } finally {
                    setIcalRefreshing(false);
                  }
                }}
                disabled={icalRefreshing}
                className="h-9 flex-1 gap-2 rounded-xl text-[12px]"
              >
                {icalRefreshing ? "새로고침 중..." : "지금 새로고침"}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  setIcalDiagLoading(true);
                  try {
                    const res = await fetch("/api/calendar/ical/diagnose");
                    const j = await res.json();
                    setIcalDiag(j);
                  } finally {
                    setIcalDiagLoading(false);
                  }
                }}
                disabled={icalDiagLoading}
                className="h-9 rounded-xl px-3 text-[12px]"
              >
                {icalDiagLoading ? "진단 중..." : "연동 진단"}
              </Button>
            </div>
            <button
              onClick={() => {
                setIcalUrl("");
                saveIcalUrl(null);
              }}
              className="mt-2 text-[11px] text-fg-muted underline-offset-4 hover:text-red-500 hover:underline"
            >
              구독 해제
            </button>
          </>
        )}
      </div>
      <DraggablePopup
        open={!!icalDiag}
        onClose={() => setIcalDiag(null)}
        title={`iCal 진단 — ${icalDiag?.step ?? ""}`}
        tone={
          icalDiag?.step === "ok"
            ? "success"
            : icalDiag?.step === "no-url"
              ? "warning"
              : "error"
        }
      >
        {icalDiag && (
          <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-fg">
            {JSON.stringify(icalDiag, null, 2)}
          </pre>
        )}
      </DraggablePopup>

      <div className="mt-5 rounded-2xl border border-border/70 bg-bg-subtle/40 p-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[14px] font-medium text-fg">
            Google Calendar (OAuth · 양방향)
          </span>
          <span
            className={
              data?.googleConnected
                ? "font-mono text-[10px] text-emerald-600"
                : "font-mono text-[10px] text-fg-subtle"
            }
          >
            {data?.googleConnected ? "● 연결됨" : "○ 미연결"}
          </span>
        </div>
        <p className="mb-3 font-mono text-[10px] text-fg-subtle">
          연결하면 Google Calendar와 양방향 동기화가 활성화됩니다.
        </p>
        {!data?.googleConnected && (
          <Button
            variant="outline"
            className="h-10 w-full justify-center gap-2 rounded-xl"
            onClick={async () => {
              const res = await signIn("google", {
                callbackUrl: "/profile?connected=1",
                redirect: false,
              });
              if (res?.error) {
                alert(
                  ".env의 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET을 채워주세요.\n\nRedirect URI: " +
                    window.location.origin +
                    "/api/auth/callback/google",
                );
              } else if (res?.url) {
                window.location.href = res.url;
              }
            }}
          >
            <Link2 className="h-4 w-4" />
            Google 계정 연결
          </Button>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-border/70 bg-bg-subtle/40 p-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[14px] font-medium text-fg">
            푸시 알림
          </span>
          <span
            className={
              push.subscribed
                ? "font-mono text-[10px] text-emerald-600"
                : "font-mono text-[10px] text-fg-subtle"
            }
          >
            {push.status === "unsupported"
              ? "● 미지원"
              : push.subscribed
                ? "● 구독 중"
                : "○ 미구독"}
          </span>
        </div>
        <p className="mb-3 font-mono text-[10px] text-fg-subtle">
          {push.status === "unsupported"
            ? "이 브라우저는 푸시 알림을 지원하지 않아요. iOS는 홈화면에 추가한 PWA에서만 가능합니다."
            : "일정 알림을 받으려면 권한을 허용해주세요."}
        </p>
        {push.status !== "unsupported" && (
          <div className="flex gap-2">
            {push.subscribed ? (
              <>
                <Button
                  variant="outline"
                  className="h-10 flex-1 justify-center gap-2 rounded-xl"
                  onClick={() => push.disable()}
                >
                  <BellOff className="h-4 w-4" />
                  알림 끄기
                </Button>
                <Button
                  className="h-10 flex-1 justify-center rounded-xl"
                  onClick={() => push.sendTest()}
                >
                  테스트 전송
                </Button>
              </>
            ) : (
              <Button
                className="h-10 w-full justify-center gap-2 rounded-xl"
                onClick={() => push.enable()}
              >
                <Bell className="h-4 w-4" />
                알림 허용하기
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
