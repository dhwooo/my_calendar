"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const isDev = process.env.NODE_ENV !== "production";

  async function submit(usernameOverride?: string, pinOverride?: string) {
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      username: usernameOverride ?? username,
      pin: pinOverride ?? pin,
      redirect: false,
    });
    setLoading(false);
    if (!res || res.error) {
      setError("ID 또는 PIN이 맞지 않습니다.");
      setPin("");
      return;
    }
    router.replace("/calendar");
    router.refresh();
  }

  async function devSeed() {
    setLoading(true);
    const res = await fetch("/api/dev/sign-in", { method: "POST" });
    if (!res.ok) {
      setError("데모 진입 실패");
      setLoading(false);
      return;
    }
    const c = (await res.json()) as { username: string; pin: string };
    await submit(c.username, c.pin);
  }

  return (
    <main className="relative z-10 flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div
        className="anim-pop w-full max-w-[420px] rounded-[28px] border border-border/60 bg-bg/70 px-8 py-10 backdrop-blur-2xl sm:px-10 sm:py-12"
        style={{ boxShadow: "0 30px 80px -30px rgb(0 0 0 / 0.18)" }}
      >
        <div className="mb-9 space-y-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-subtle">
            dhwoo · calendar
          </p>
          <h1 className="text-gradient text-gradient-animated text-[36px] font-medium leading-[1.05] tracking-tight sm:text-[40px]">
            다시 오셨네요.
          </h1>
          <p className="mx-auto max-w-[280px] text-[13px] leading-relaxed text-fg-muted">
            ID와 4자리 PIN으로 로그인하세요.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-5"
        >
          <div>
            <label className="mb-1.5 block px-1 text-[11px] font-medium text-fg-muted">
              ID
            </label>
            <Input
              placeholder="예: dhwoo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="h-11 rounded-xl"
            />
          </div>

          <div>
            <label className="mb-2 block px-1 text-center text-[11px] font-medium text-fg-muted">
              PIN
            </label>
            <PinInput
              value={pin}
              onChange={setPin}
              length={6}
              onComplete={(p) => submit(undefined, p)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-600">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || pin.length !== 6 || !username}
            className="h-11 w-full rounded-xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "로그인"}
          </Button>
        </form>

        <p className="mt-5 text-center text-[12px] text-fg-muted">
          계정이 없으신가요?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-fg underline-offset-4 hover:underline"
          >
            가입하기
          </Link>
        </p>

        {isDev && (
          <>
            <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
              <span className="h-px flex-1 bg-border" />
              개발 모드
              <span className="h-px flex-1 bg-border" />
            </div>
            <button
              type="button"
              onClick={devSeed}
              disabled={loading}
              className="group flex w-full items-center justify-between rounded-xl border border-border bg-bg-subtle px-4 py-3 text-left transition hover:border-fg/30 hover:bg-bg-muted disabled:opacity-50"
            >
              <div>
                <div className="text-[13px] font-medium text-fg">
                  데모 계정으로 둘러보기
                </div>
                <div className="font-mono text-[10px] text-fg-subtle">
                  ID: demo · PIN: 0000 · 샘플 일정 자동 시드
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-fg-muted transition group-hover:translate-x-0.5 group-hover:text-fg" />
            </button>
          </>
        )}
      </div>
    </main>
  );
}
