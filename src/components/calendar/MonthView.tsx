"use client";

import { cn } from "@/lib/utils";
import {
  daysBetween,
  fmt,
  isSameDay,
  isSameMonth,
  monthGridRange,
} from "@/lib/date";
import { getHoliday, weekdayTone } from "@/lib/holidays";
import type { EventDTO } from "@/types/calendar";

type Props = {
  anchor: Date;
  selected: Date;
  events: EventDTO[];
  onSelectDay: (d: Date) => void;
  onSelectEvent: (e: EventDTO) => void;
};

const WEEK = [
  { label: "월", tone: "text-fg-subtle" },
  { label: "화", tone: "text-fg-subtle" },
  { label: "수", tone: "text-fg-subtle" },
  { label: "목", tone: "text-fg-subtle" },
  { label: "금", tone: "text-fg-subtle" },
  { label: "토", tone: "text-blue-500/80" },
  { label: "일", tone: "text-red-500/80" },
];

function eventsOn(day: Date, events: EventDTO[]) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return events.filter((e) => {
    const es = new Date(e.start);
    const ee = new Date(e.end);
    return es <= end && ee >= start;
  });
}

export function MonthView({
  anchor,
  selected,
  events,
  onSelectDay,
  onSelectEvent,
}: Props) {
  const days = daysBetween(monthGridRange(anchor));
  const today = new Date();

  return (
    <div className="grid h-full grid-rows-[auto_1fr] px-4 pb-6 sm:px-8 sm:pb-8 anim-fade-in">
      <div className="grid grid-cols-7">
        {WEEK.map((w) => (
          <div
            key={w.label}
            className={cn(
              "px-3 pb-3 font-mono text-[10px] uppercase tracking-[0.22em]",
              w.tone,
            )}
          >
            {w.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 overflow-hidden rounded-2xl border border-border/70 bg-bg/40 backdrop-blur-sm">
        {days.map((d, i) => {
          const dayEvents = eventsOn(d, events);
          const muted = !isSameMonth(d, anchor);
          const isToday = isSameDay(d, today);
          const isSel = isSameDay(d, selected);
          const col = i % 7;
          const row = Math.floor(i / 7);
          const tone = weekdayTone(d);
          const holiday = getHoliday(d);

          // Find the most recent mood emoji for this day
          const mood = dayEvents
            .filter((e) => (e as EventDTO & { mood?: string | null }).mood)
            .map((e) => (e as EventDTO & { mood?: string | null }).mood!)
            .pop();

          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelectDay(d)}
              className={cn(
                "group relative flex min-h-[96px] sm:min-h-[112px] flex-col items-stretch p-2 text-left transition",
                "hover:bg-bg-subtle/60",
                col < 6 && "border-r border-border/60",
                row < 5 && "border-b border-border/60",
                muted && "bg-bg-subtle/30",
                isSel && "bg-bg-subtle/80",
                holiday && !muted && "bg-red-500/[0.035] hover:bg-red-500/[0.06]",
              )}
            >
              {/* Holiday accent bar */}
              {holiday && !muted && (
                <span
                  className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-red-500/70 via-red-500/40 to-transparent"
                  aria-hidden
                />
              )}

              <div className="mb-1.5 flex items-center justify-between gap-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-6 min-w-6 items-center justify-center px-1.5 font-mono text-[11px]",
                      muted ? tone.muted : tone.text,
                      isToday && "rounded-full bg-accent !text-accent-fg",
                    )}
                  >
                    {fmt.day(d)}
                  </span>
                  {holiday && !muted && (
                    <span
                      className="truncate rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium leading-none text-red-500 sm:text-[10px]"
                      title={holiday}
                    >
                      {holiday}
                    </span>
                  )}
                </div>
                {mood && <span className="shrink-0 text-[14px]">{mood}</span>}
              </div>

              <div className="flex flex-col gap-[3px] overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelectEvent(e);
                    }}
                    className="flex items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[11px] text-fg transition hover:bg-bg-muted"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {!e.allDay && (
                      <span className="font-mono text-[10px] text-fg-subtle">
                        {fmt.time(new Date(e.start))}
                      </span>
                    )}
                    <span className="truncate">{e.title}</span>
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span className="pl-2 font-mono text-[10px] text-fg-subtle">
                    +{dayEvents.length - 3}개 더
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
