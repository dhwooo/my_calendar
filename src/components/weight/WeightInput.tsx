"use client";

import * as React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onAdd: (entry: { date: string; kg: number }) => Promise<void>;
};

export function WeightInput({ onAdd }: Props) {
  const [kg, setKg] = React.useState("");
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = React.useState(false);

  async function submit() {
    if (!kg) return;
    const value = parseFloat(kg);
    if (Number.isNaN(value) || value <= 0) return;
    setSaving(true);
    try {
      // Use local noon to avoid timezone drift on date-only picker
      const iso = new Date(`${date}T12:00:00`).toISOString();
      await onAdd({ date: iso, kg: value });
      setKg("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-fg/10 bg-gradient-to-br from-[rgb(var(--grad-1))]/6 to-[rgb(var(--grad-3))]/6 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[14px] font-medium tracking-tight text-fg">
          체중 입력
        </h2>
        <span className="font-mono text-[10px] text-fg-subtle">
          {format(new Date(date), "M월 d일 (EEE)")}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_140px_auto] gap-2">
        <Input
          type="date"
          value={date}
          max={format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 rounded-xl text-[14px]"
        />
        <Input
          type="number"
          step="0.1"
          inputMode="decimal"
          placeholder="kg"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="h-12 rounded-xl text-[18px] tabular-nums"
          autoFocus
        />
        <Button
          onClick={submit}
          disabled={saving || !kg}
          className="h-12 rounded-xl px-6"
        >
          기록
        </Button>
      </div>
    </div>
  );
}
