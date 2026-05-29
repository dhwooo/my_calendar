"use client";

import * as React from "react";
import useSWR from "swr";
import { format } from "date-fns";
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

const CATEGORIES = ["현금", "주식", "암호화폐", "예금", "부동산", "기타"];
const won = (n: number) => `₩ ${n.toLocaleString("ko-KR")}`;
const PALETTE = [
  "rgb(var(--grad-1))",
  "rgb(var(--grad-3))",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#a855f7",
];

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

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-8 anim-stagger">
      <div className="mb-5 rounded-2xl border border-fg/10 bg-gradient-to-br from-[rgb(var(--grad-1))]/8 to-[rgb(var(--grad-3))]/8 p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
          총 자산
        </div>
        <div className="mt-2 text-[40px] font-semibold leading-none tracking-tight text-fg tabular-nums sm:text-[52px]">
          {won(total)}
        </div>
        {Object.keys(byCategory).length > 0 && (
          <CategoryBar total={total} byCategory={byCategory} />
        )}
      </div>

      <div className="mb-5 rounded-2xl border border-border/70 bg-bg-subtle/40 p-5">
        <h2 className="mb-3 text-[14px] font-medium tracking-tight text-fg">
          자산 추가
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_140px_auto]">
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
          <div className="flex flex-wrap gap-1 rounded-xl bg-bg-muted/60 p-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1 text-[11px] font-medium transition",
                  category === c
                    ? "bg-bg text-fg shadow-sm"
                    : "text-fg-muted hover:text-fg",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <Button
            onClick={add}
            disabled={saving || !label || !amount}
            className="h-11 rounded-xl"
          >
            추가
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-bg-subtle/40 p-5">
        <h2 className="mb-3 text-[14px] font-medium tracking-tight text-fg">
          내역
        </h2>
        {entries.length === 0 ? (
          <p className="font-mono text-[11px] text-fg-subtle">
            첫 자산을 추가해보세요.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3">
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
                <span className="font-medium text-fg tabular-nums">
                  {won(e.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryBar({
  total,
  byCategory,
}: {
  total: number;
  byCategory: Record<string, number>;
}) {
  const items = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mt-5 space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bg-muted/60">
        {items.map(([k, v], i) => (
          <div
            key={k}
            style={{
              width: `${(v / total) * 100}%`,
              backgroundColor: PALETTE[i % PALETTE.length],
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-fg-subtle">
        {items.map(([k, v], i) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            />
            {k} · {((v / total) * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}
