"use client";

import * as React from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Entry = {
  id: string;
  date: string;
  label: string;
  amount: number;
  category: string | null;
};

const CATEGORIES = [
  { key: "현금", color: "#3b82f6" },
  { key: "주식", color: "#ef4444" },
  { key: "암호화폐", color: "#f59e0b" },
  { key: "예금", color: "#10b981" },
  { key: "부동산", color: "#a855f7" },
  { key: "기타", color: "rgb(var(--grad-1))" },
] as const;

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;
const wonShort = (n: number) => {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(2)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return n.toLocaleString("ko-KR");
};

function getColor(category: string | null) {
  return (
    CATEGORIES.find((c) => c.key === category)?.color ?? "rgb(var(--grad-3))"
  );
}

export function AssetsClient({ initialEntries }: { initialEntries: Entry[] }) {
  const { data, mutate } = useSWR<{ entries: Entry[] }>("/api/assets", {
    fallbackData: { entries: initialEntries },
    revalidateOnMount: false,
  });
  const entries = data?.entries ?? [];

  const total = entries.reduce((s, e) => s + e.amount, 0);
  const byCategory = entries.reduce<Record<string, number>>((acc, e) => {
    const k = e.category ?? "기타";
    acc[k] = (acc[k] ?? 0) + e.amount;
    return acc;
  }, {});

  const [label, setLabel] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<string>("현금");
  const [saving, setSaving] = React.useState(false);

  async function add() {
    if (!label || !amount) return;
    const num = parseInt(amount.replace(/,/g, ""), 10);
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Entry = {
      id: tempId,
      date: new Date().toISOString(),
      label,
      amount: num,
      category,
    };
    setSaving(true);
    await mutate(
      async () => {
        const res = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, amount: num, category }),
        });
        if (!res.ok) throw new Error("save failed");
        const created = (await res.json()) as Entry;
        return {
          entries: [created, ...entries.filter((e) => e.id !== tempId)],
        };
      },
      {
        optimisticData: { entries: [optimistic, ...entries] },
        rollbackOnError: true,
        revalidate: false,
      },
    );
    setSaving(false);
    setLabel("");
    setAmount("");
  }

  async function remove(id: string) {
    if (!confirm("이 자산을 삭제할까요?")) return;
    await mutate(
      async () => {
        await fetch(`/api/assets/${id}`, { method: "DELETE" }).catch(() => {});
        return { entries: entries.filter((e) => e.id !== id) };
      },
      {
        optimisticData: { entries: entries.filter((e) => e.id !== id) },
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-8 anim-stagger">
      {/* Hero card — total + donut */}
      <div className="rounded-3xl border border-fg/10 bg-gradient-to-br from-[rgb(var(--grad-1))]/8 via-[rgb(var(--grad-2))]/4 to-[rgb(var(--grad-3))]/8 p-6 sm:p-8">
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_180px]">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
              총 자산
            </div>
            <div className="mt-2 break-all text-[36px] font-semibold leading-none tracking-tight text-fg tabular-nums sm:text-[48px]">
              {won(total)}
            </div>
            <div className="mt-2 font-mono text-[11px] text-fg-muted">
              {entries.length}건 · {Object.keys(byCategory).length}개 카테고리
            </div>
          </div>
          {total > 0 && <Donut total={total} byCategory={byCategory} />}
        </div>

        {total > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center gap-2 rounded-xl bg-bg/60 px-3 py-2 backdrop-blur-sm"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: getColor(k) }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-fg">
                      {k}
                    </div>
                    <div className="font-mono text-[10px] text-fg-subtle tabular-nums">
                      {wonShort(v)} · {((v / total) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-5 rounded-2xl border border-border/70 bg-bg-subtle/40 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[14px] font-medium tracking-tight text-fg">
            자산 추가
          </h2>
          <span className="font-mono text-[10px] text-fg-subtle">
            {format(new Date(), "yyyy.M.d")}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.2fr_1fr]">
            <Input
              placeholder="이름 (예: 신한 적금)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-11 rounded-xl"
            />
            <Input
              inputMode="numeric"
              placeholder="금액 (KRW)"
              value={
                amount
                  ? Number(amount.replace(/,/g, "")).toLocaleString("ko-KR")
                  : ""
              }
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              className="h-11 rounded-xl tabular-nums"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                    active
                      ? "border-fg/30 bg-bg shadow-sm"
                      : "border-border bg-bg-subtle/60 text-fg-muted hover:bg-bg-muted",
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.key}
                </button>
              );
            })}
          </div>

          <Button
            onClick={add}
            disabled={saving || !label || !amount}
            className="h-11 w-full rounded-xl"
          >
            추가
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="mt-5 rounded-2xl border border-border/70 bg-bg-subtle/40 p-5">
        <h2 className="mb-3 text-[14px] font-medium tracking-tight text-fg">
          내역
        </h2>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center">
            <p className="text-[13px] text-fg-muted">자산이 없습니다</p>
            <p className="mt-1 font-mono text-[10px] text-fg-subtle">
              위에서 첫 자산을 추가해보세요
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {entries.map((e) => (
              <li
                key={e.id}
                className="group flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-9 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: getColor(e.category) }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-fg">
                      {e.label}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-fg-subtle">
                      {e.category && (
                        <span className="rounded-full bg-bg-muted px-2 py-0.5">
                          {e.category}
                        </span>
                      )}
                      <span>{format(new Date(e.date), "yyyy.M.d")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[15px] font-semibold text-fg tabular-nums">
                    {won(e.amount)}
                  </span>
                  <button
                    onClick={() => remove(e.id)}
                    className="rounded-md p-1.5 text-fg-subtle opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Donut chart ─────────────────────────────── */

function Donut({
  total,
  byCategory,
}: {
  total: number;
  byCategory: Record<string, number>;
}) {
  const SIZE = 160;
  const R = 68;
  const STROKE = 16;
  const C = 2 * Math.PI * R;

  const slices = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({
      key: k,
      pct: v / total,
      color: getColor(k),
    }));

  let offset = 0;
  return (
    <div className="relative mx-auto sm:mx-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="rgb(var(--bg-muted))"
          strokeWidth={STROKE}
        />
        {slices.map((s) => {
          const dash = s.pct * C;
          const el = (
            <circle
              key={s.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-fg-subtle">
          assets
        </span>
        <span className="mt-0.5 text-[14px] font-semibold tabular-nums text-fg">
          {wonShort(total)}
        </span>
      </div>
    </div>
  );
}
