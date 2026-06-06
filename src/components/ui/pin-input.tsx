"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  onComplete?: (v: string) => void;
};

export function PinInput({
  value,
  onChange,
  length = 4,
  autoFocus,
  onComplete,
}: Props) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  React.useEffect(() => {
    if (!autoFocus) return;
    // Defer focus to after layout/anim so it works reliably across step transitions.
    const t = setTimeout(() => refs.current[0]?.focus(), 60);
    return () => clearTimeout(t);
  }, [autoFocus]);

  const setAt = (i: number, ch: string) => {
    const next = (value + " ".repeat(length)).slice(0, length).split("");
    next[i] = ch;
    const joined = next.join("").replace(/\s+/g, " ").trimEnd();
    onChange(joined.length > length ? joined.slice(0, length) : joined);
    if (joined.replace(/\s/g, "").length === length) onComplete?.(joined);
  };

  return (
    <div className="flex justify-center gap-2.5">
      {Array.from({ length }).map((_, i) => {
        const ch = value[i] ?? "";
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={ch}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (!v) {
                setAt(i, "");
                return;
              }
              setAt(i, v[v.length - 1]);
              if (i < length - 1) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !ch && i > 0) {
                refs.current[i - 1]?.focus();
                setAt(i - 1, "");
              }
              if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "ArrowRight" && i < length - 1)
                refs.current[i + 1]?.focus();
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text").replace(/\D/g, "");
              if (!text) return;
              e.preventDefault();
              onChange(text.slice(0, length));
              const lastIdx = Math.min(text.length, length) - 1;
              refs.current[lastIdx]?.focus();
              if (text.length >= length) onComplete?.(text.slice(0, length));
            }}
            className={cn(
              "h-14 w-12 rounded-2xl border border-border bg-bg-subtle text-center text-[22px] font-medium tracking-tight",
              "focus:border-fg/40 focus:outline-none focus:ring-2 focus:ring-fg/15",
              "transition",
            )}
          />
        );
      })}
    </div>
  );
}
