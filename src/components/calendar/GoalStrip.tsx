"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Goal = {
  id: string;
  year: number;
  month: number | null;
  text: string;
  done: boolean;
};

export function GoalStrip({ year, month }: { year: number; month: number }) {
  const key = `/api/goals?year=${year}`;
  const { data } = useSWR<{ goals: Goal[] }>(key);
  const yearGoals = (data?.goals ?? []).filter((g) => g.month === null);
  const monthGoals = (data?.goals ?? []).filter((g) => g.month === month);

  const toggle = async (g: Goal) => {
    await fetch(`/api/goals/${g.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: !g.done }),
    });
    mutate(key);
  };

  return (
    <div className="border-b border-border/60 bg-bg-subtle/30 px-4 py-3 sm:px-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-fg-muted" />
          <span className="text-[12px] font-medium tracking-tight text-fg">
            목표
          </span>
        </div>
        <Link
          href="/goals"
          className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-subtle transition hover:text-fg"
        >
          관리
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Column title={`${year}년`} sub="year" goals={yearGoals} onToggle={toggle} />
        <Column title={`${month}월`} sub="month" goals={monthGoals} onToggle={toggle} />
      </div>
    </div>
  );
}

function Column({
  title,
  sub,
  goals,
  onToggle,
}: {
  title: string;
  sub: string;
  goals: Goal[];
  onToggle: (g: Goal) => void;
}) {
  const done = goals.filter((g) => g.done).length;
  return (
    <div className="rounded-xl border border-border/50 bg-bg p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[12px] font-semibold tracking-tight text-fg">
            {title}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-fg-subtle">
            {sub}
          </span>
        </div>
        {goals.length > 0 && (
          <span className="font-mono text-[10px] text-fg-muted">
            {done}/{goals.length}
          </span>
        )}
      </div>
      {goals.length === 0 ? (
        <Link
          href="/goals"
          className="block py-1 font-mono text-[10px] text-fg-subtle hover:text-fg"
        >
          + 목표 추가
        </Link>
      ) : (
        <ul className="space-y-0.5">
          {goals.map((g) => (
            <li key={g.id} className="flex items-start gap-2 rounded px-1 py-1 hover:bg-bg-muted">
              <button
                onClick={() => onToggle(g)}
                className={cn(
                  "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                  g.done
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border",
                )}
              >
                {g.done && (
                  <svg viewBox="0 0 20 20" className="h-2.5 w-2.5">
                    <path
                      d="M5 10.5l3.5 3.5L15 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-[12px] leading-snug",
                  g.done ? "text-fg-subtle line-through" : "text-fg",
                )}
              >
                {g.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
