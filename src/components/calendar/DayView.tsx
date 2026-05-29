"use client";

import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/date";
import type { EventDTO } from "@/types/calendar";

type Props = {
  anchor: Date;
  events: EventDTO[];
  onSelectEvent: (e: EventDTO) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({ anchor, events, onSelectEvent }: Props) {
  const dayStart = new Date(anchor);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(anchor);
  dayEnd.setHours(23, 59, 59, 999);
  const dayEvents = events.filter((e) => {
    const es = new Date(e.start);
    const ee = new Date(e.end);
    return es <= dayEnd && ee >= dayStart;
  });

  const today = new Date();
  const isToday = isSameDay(anchor, today);
  const nowOffset = isToday
    ? ((today.getHours() * 60 + today.getMinutes()) / 60) * 48
    : null;

  return (
    <div className="flex h-full flex-col px-6 pb-8 sm:px-8">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-gradient text-[34px] font-semibold leading-none tracking-tight">
          {format(anchor, "M월 d일")}
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          {format(anchor, "EEEE")}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-[56px_1fr] overflow-auto rounded-2xl border border-border/60 bg-bg/40 backdrop-blur-sm">
        <div className="border-r border-border/60">
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex h-12 items-start justify-end pr-2 pt-1 font-mono text-[10px] text-fg-subtle"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} className="h-12 border-b border-border/40" />
          ))}
          {nowOffset !== null && (
            <div
              className="pointer-events-none absolute left-0 right-2 flex items-center gap-1"
              style={{ top: nowOffset }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="h-px flex-1 bg-red-500" />
            </div>
          )}
          {dayEvents.map((e) => {
            const es = new Date(e.start);
            const ee = new Date(e.end);
            const top =
              ((Math.max(es.getTime(), dayStart.getTime()) -
                dayStart.getTime()) /
                (1000 * 60 * 60)) *
              48;
            const height = Math.max(
              28,
              ((Math.min(ee.getTime(), dayEnd.getTime()) -
                Math.max(es.getTime(), dayStart.getTime())) /
                (1000 * 60 * 60)) *
                48,
            );
            return (
              <button
                key={e.id}
                onClick={() => onSelectEvent(e)}
                style={{ top, height }}
                className={cn(
                  "absolute left-2 right-3 overflow-hidden rounded-lg bg-bg-muted px-3 py-1.5 text-left transition hover:bg-fg/10",
                  "ring-1 ring-inset ring-accent/30",
                )}
              >
                <div className="text-[12px] font-medium leading-tight text-fg">
                  {e.title}
                </div>
                <div className="font-mono text-[10px] text-fg-muted">
                  {fmt.time(es)} – {fmt.time(ee)}
                  {e.location ? ` · ${e.location}` : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
