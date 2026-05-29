"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";

type Step = 1 | 2 | 3;

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [pin2, setPin2] = React.useState("");
  const [step, setStep] = React.useState<Step>(1);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function goNext() {
    setError(null);
    if (step === 1) {
      if (!name.trim()) return setError("이름을 입력해주세요.");
      if (!username.match(/^[a-z0-9_.-]{2,24}$/i))
        return setError("ID는 영문/숫자 2~24자만 사용할 수 있어요.");
      setStep(2);
    } else if (step === 2) {
      if (pin.length !== 6) return setError("PIN을 6자리로 입력해주세요.");
      setStep(3);
    }
  }

  async function submit() {
    setError(null);
    if (pin !== pin2) {
      setError("PIN이 일치하지 않습니다. 다시 입력해주세요.");
      setPin2("");
      return;
    }
    setLoading(true);
    const signUp = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, pin }),
    });
    if (!signUp.ok) {
      const data = await signUp.json().catch(() => ({}));
      setError(data?.error ?? "가입에 실패했습니다.");
      setLoading(false);
      return;
    }
    const signedIn = await signIn("credentials", {
      username,
      pin,
      redirect: false,
    });
    setLoading(false);
    if (signedIn?.ok) {
      router.replace("/calendar");
      router.refresh();
    } else {
      router.replace("/sign-in");
    }
  }

  function back() {
    setError(null);
    if (step === 1) router.push("/sign-in");
    else if (step === 2) setStep(1);
    else setStep(2);
  }

  return (
    <main className="relative z-10 flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div
        className="w-full max-w-[420px] rounded-[28px] border border-border/60 bg-bg/70 px-8 py-10 backdrop-blur-2xl sm:px-10 sm:py-12"
        style={{ boxShadow: "0 30px 80px -30px rgb(0 0 0 / 0.18)" }}
      >
        <button
          onClick={back}
          className="mb-4 flex items-center gap-1.5 text-[12px] text-fg-muted hover:text-fg"
          aria-label="뒤로"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          뒤로
        </button>

        {/* Step indicator */}
        <div className="mb-7 flex items-center justify-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={
                s === step
                  ? "h-1 w-6 rounded-full bg-fg transition-all duration-500"
                  : s < step
                    ? "h-1 w-3 rounded-full bg-fg/40 transition-all duration-500"
                    : "h-1 w-3 rounded-full bg-fg/15 transition-all duration-500"
              }
            />
          ))}
        </div>

        <div className="mb-7 space-y-2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-subtle">
            private calendar
          </p>
          <h1 className="text-gradient text-gradient-animated text-[32px] font-medium leading-[1.05] tracking-tight sm:text-[36px]">
            {step === 1 && "환영합니다."}
            {step === 2 && "PIN을 정해주세요."}
            {step === 3 && "한 번 더 입력."}
          </h1>
          <p className="mx-auto max-w-[280px] text-[13px] leading-relaxed text-fg-muted">
            {step === 1 && "이름과 ID만 정해주시면 됩니다."}
            {step === 2 && "로그인 시 사용할 숫자 6자리입니다."}
            {step === 3 && "방금 입력한 PIN을 확인해주세요."}
          </p>
        </div>

        <div key={step} className="anim-stage space-y-5">
          {step === 1 && (
            <div className="space-y-3">
              <Input
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="h-11 rounded-xl"
              />
              <Input
                placeholder="ID (영문/숫자, 2~24자)"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
                }
                required
                autoComplete="username"
                className="h-11 rounded-xl"
              />
            </div>
          )}

          {step === 2 && (
            <PinInput
              value={pin}
              onChange={setPin}
              autoFocus
              onComplete={() => {
                setError(null);
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <PinInput
              value={pin2}
              onChange={setPin2}
              autoFocus
              onComplete={(v) => {
                if (v === pin) submit();
                else {
                  setError("PIN이 일치하지 않습니다. 다시 입력해주세요.");
                  setPin2("");
                }
              }}
            />
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-600">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step !== 3 && (
            <Button onClick={goNext} className="h-11 w-full rounded-xl">
              다음
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={submit}
              disabled={loading || pin2.length !== 6}
              className="h-11 w-full rounded-xl"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "가입 완료"}
            </Button>
          )}
        </div>

        <p className="mt-5 text-center text-[12px] text-fg-muted">
          이미 계정이 있으세요?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-fg underline-offset-4 hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
