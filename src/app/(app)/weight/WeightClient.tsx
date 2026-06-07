"use client";

import * as React from "react";
import useSWR from "swr";
import { Target } from "lucide-react";
import { WeightInput } from "@/components/weight/WeightInput";
import { WeightSummary } from "@/components/weight/WeightSummary";
import { WeightChart } from "@/components/weight/WeightChart";
import { WeightHistory } from "@/components/weight/WeightHistory";

type Entry = { id: string; date: string; kg: number };
type ProfileResp = { user: { targetWeightKg: number | null } };

export function WeightClient({ initialEntries }: { initialEntries: Entry[] }) {
  const { data, mutate } = useSWR<{ entries: Entry[] }>("/api/weight", {
    fallbackData: { entries: initialEntries },
    revalidateOnMount: false,
  });
  const { data: profile, mutate: mutateProfile } = useSWR<ProfileResp>("/api/profile");
  const entries = data?.entries ?? [];
  const targetKg = profile?.user?.targetWeightKg ?? null;
  const [targetInput, setTargetInput] = React.useState<string>("");

  React.useEffect(() => {
    setTargetInput(targetKg != null ? String(targetKg) : "");
  }, [targetKg]);

  async function saveTarget(v: string) {
    const num = v === "" ? null : Number(v);
    if (num != null && (isNaN(num) || num < 20 || num > 300)) return;
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetWeightKg: num }),
    });
    await mutateProfile();
  }

  async function add(payload: { date: string; kg: number }) {
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Entry = { id: tempId, date: payload.date, kg: payload.kg };
    const nextEntries = [...entries, optimistic].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    await mutate(
      async () => {
        const res = await fetch("/api/weight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("save failed");
        const created = (await res.json()) as Entry;
        const merged = [
          ...entries.filter((e) => e.id !== tempId),
          created,
        ].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        return { entries: merged };
      },
      {
        optimisticData: { entries: nextEntries },
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }

  return (
    <div className="anim-stagger space-y-5">
      <WeightInput onAdd={add} />
      <WeightSummary entries={entries} />

      <div className="rounded-2xl border border-border/70 bg-bg-subtle/40 p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[14px] font-medium tracking-tight text-fg">
            추이
          </h2>
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-fg-muted" />
            <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              목표
            </label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onBlur={() => saveTarget(targetInput)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              placeholder="75.0"
              className="h-7 w-20 rounded-md border border-border/60 bg-bg px-2 font-mono text-[12px] tabular-nums outline-none focus:border-accent/60"
            />
            <span className="font-mono text-[10px] text-fg-subtle">kg</span>
            <span className="ml-2 font-mono text-[10px] text-fg-subtle">
              최근 {Math.min(entries.length, 60)}개
            </span>
          </div>
        </div>
        <WeightChart entries={entries.slice(-60)} targetKg={targetKg} />
      </div>

      <WeightHistory entries={entries} />
    </div>
  );
}
