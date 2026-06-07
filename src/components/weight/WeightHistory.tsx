"use client";

import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Entry = { id: string; date: string; kg: number };

export function WeightHistory({
  entries,
  embedded,
}: {
  entries: Entry[];
  embedded?: boolean;
}) {
  // entries are ascending; show newest first with delta vs previous (older).
  const reversed = [...entries].reverse();

  return (
    <div
      className={cn(
        embedded
          ? "px-5"
          : "rounded-2xl border border-border/70 bg-bg-subtle/40 p-5",
      )}
    >
      <h2 className="mb-3 text-[14px] font-medium tracking-tight text-fg">
        기록
      </h2>
      {reversed.length === 0 ? (
        <p className="font-mono text-[11px] text-fg-subtle">
          아직 기록이 없어요. 첫 번째 체중을 추가해보세요.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {reversed.map((e, i) => {
            const previousEntry = reversed[i + 1];
            const delta = previousEntry ? e.kg - previousEntry.kg : null;
            return (
              <li key={e.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-baseline gap-3">
                  <span className="text-[17px] font-semibold text-fg tabular-nums sm:text-[15px] sm:font-medium">
                    {e.kg.toFixed(1)}
                    <span className="ml-0.5 font-mono text-[12px] text-fg-subtle sm:text-[11px]">
                      kg
                    </span>
                  </span>
                  {delta !== null && <DeltaPill delta={delta} />}
                </div>
                <span className="font-mono text-[12px] text-fg-subtle sm:text-[11px]">
                  {format(new Date(e.date), "yyyy.M.d")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  const rounded = Math.abs(delta) < 0.05 ? 0 : delta;
  const Icon = rounded === 0 ? Minus : rounded > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums sm:text-[10px]",
        rounded === 0 && "bg-bg-muted text-fg-subtle",
        rounded > 0 && "bg-red-500/10 text-red-600",
        rounded < 0 && "bg-blue-500/10 text-blue-600",
      )}
    >
      <Icon className="h-3 w-3" />
      {rounded > 0 ? "+" : ""}
      {rounded.toFixed(1)}
    </span>
  );
}
