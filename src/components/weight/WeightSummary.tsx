"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Entry = { id: string; date: string; kg: number };

export function WeightSummary({ entries }: { entries: Entry[] }) {
  const latest = entries.at(-1);
  const prev = entries.at(-2);
  const delta = latest && prev ? latest.kg - prev.kg : 0;
  const min = entries.length ? Math.min(...entries.map((e) => e.kg)) : null;
  const max = entries.length ? Math.max(...entries.map((e) => e.kg)) : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="현재" value={latest ? latest.kg.toFixed(1) : "—"} unit="kg" accent />
      <Card
        label="이전 대비"
        value={
          latest && prev ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}` : "—"
        }
        unit="kg"
        trend={delta}
      />
      <Card label="최저" value={min !== null ? min.toFixed(1) : "—"} unit="kg" />
      <Card label="최고" value={max !== null ? max.toFixed(1) : "—"} unit="kg" />
    </div>
  );
}

function Card({
  label,
  value,
  unit,
  trend,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  trend?: number;
  accent?: boolean;
}) {
  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
        ? TrendingUp
        : TrendingDown;
  const trendColor =
    trend === undefined || trend === 0
      ? "text-fg-subtle"
      : trend > 0
        ? "text-red-500"
        : "text-emerald-500";
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        accent
          ? "border-fg/10 bg-gradient-to-br from-[rgb(var(--grad-1))]/8 to-[rgb(var(--grad-3))]/8"
          : "border-border/70 bg-bg-subtle/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
          {label}
        </span>
        {trend !== undefined && (
          <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[26px] font-semibold leading-none tracking-tight text-fg tabular-nums">
          {value}
        </span>
        <span className="font-mono text-[11px] text-fg-subtle">{unit}</span>
      </div>
    </div>
  );
}
