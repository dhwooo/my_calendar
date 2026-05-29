"use client";

import useSWR from "swr";
import { WeightInput } from "@/components/weight/WeightInput";
import { WeightSummary } from "@/components/weight/WeightSummary";
import { WeightChart } from "@/components/weight/WeightChart";
import { WeightHistory } from "@/components/weight/WeightHistory";

type Entry = { id: string; date: string; kg: number };

export function WeightClient({ initialEntries }: { initialEntries: Entry[] }) {
  const { data, mutate } = useSWR<{ entries: Entry[] }>("/api/weight", {
    fallbackData: { entries: initialEntries },
    revalidateOnMount: false,
  });
  const entries = data?.entries ?? [];

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
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[14px] font-medium tracking-tight text-fg">
            추이
          </h2>
          <span className="font-mono text-[10px] text-fg-subtle">
            최근 {Math.min(entries.length, 60)}개
          </span>
        </div>
        <WeightChart entries={entries.slice(-60)} />
      </div>

      <WeightHistory entries={entries} />
    </div>
  );
}
