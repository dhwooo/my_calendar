"use client";

import { cn } from "@/lib/utils";
import {
  daysBetween,
  fmt,
  isSameDay,
  weekRange,
} from "@/lib/date";
import type { EventDTO } from "@/types/calendar";

type Props = {
  anchor: Date;
  events: EventDTO[];
  onSelectEvent: (e: EventDTO) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView({ anchor, events, onSelectEvent }: Props) {
  const days = daysBetween(weekRange(anchor));
  const today = new Date();

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-y border-border bg-bg-subtle/40">
        <div />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toISOString()} className="px-2 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
                {fmt.weekday(d)}
              </div>
              <div
                className={cn(
                  "mt-0.5 text-lg font-medium tracking-tight",
                  isToday && "text-gradient",
                )}
              >
                {fmt.day(d)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative grid flex-1 grid-cols-[64px_repeat(7,1fr)] overflow-auto">
        <div className="border-r border-border">
          {HOURS.map((h) => (
            <div
              key={h}
              className="h-12 px-2 pt-1 text-right font-mono text-[10px] text-fg-subtle"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((d) => {
          const dayStart = new Date(d);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(d);
          dayEnd.setHours(23, 59, 59, 999);
          const dayEvents = events.filter((e) => {
            const es = new Date(e.start);
            const ee = new Date(e.end);
            return es <= dayEnd && ee >= dayStart;
          });

          return (
            <div
              key={d.toISOString()}
              className="relative border-r border-border"
            >
              {HOURS.map((h) => (
                <div key={h} className="h-12 border-b border-border/60" />
              ))}
              {dayEvents.map((e) => {
                const es = new Date(e.start);
                const ee = new Date(e.end);
                const top =
                  ((Math.max(es.getTime(), dayStart.getTime()) -
                    dayStart.getTime()) /
                    (1000 * 60 * 60)) *
                  48;
                const height = Math.max(
                  24,
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
                    className="absolute left-1 right-1 overflow-hidden rounded-md bg-accent/10 px-2 py-1 text-left text-[11px] text-fg ring-1 ring-inset ring-accent/30 hover:bg-accent/15"
                  >
                    <div className="font-medium leading-tight">{e.title}</div>
                    <div className="font-mono text-[10px] text-fg-muted">
                      {fmt.time(es)} – {fmt.time(ee)}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
