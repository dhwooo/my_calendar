"use client";

import { cn } from "@/lib/utils";
import {
  daysBetween,
  eventOnDay,
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
  weightByDate?: Map<string, { kg: number; delta: number | null }>;
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
  return events.filter((e) => eventOnDay(e, day));
}

export function MonthView({
  anchor,
  selected,
  events,
  weightByDate,
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

          const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const weightInfo = weightByDate?.get(dayKey);
          const weight = weightInfo?.kg;
          const weightDelta = weightInfo?.delta ?? null;

          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelectDay(d)}
              className={cn(
                "group relative flex min-h-[96px] sm:min-h-[112px] flex-col items-stretch p-1 text-left transition sm:p-2",
                "hover:bg-bg-subtle/60",
                col < 6 && "border-r border-border/60",
                row < 5 && "border-b border-border/60",
                muted && "bg-bg-subtle/30",
                isSel && "bg-bg-subtle/80",
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-1">
                <span
                  className={cn(
                    "flex h-6 min-w-6 items-center justify-center px-1.5 font-mono text-[11px]",
                    muted ? tone.muted : tone.text,
                    isToday && "rounded-full bg-accent !text-accent-fg",
                  )}
                >
                  {fmt.day(d)}
                </span>
                {mood && <span className="shrink-0 text-[14px]">{mood}</span>}
              </div>

              {holiday && !muted && (
                <div className="mb-1 flex">
                  <span
                    className="truncate rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-red-500"
                    title={holiday}
                  >
                    {holiday}
                  </span>
                </div>
              )}

              {(() => {
                const maxVisible = 2;
                const visible = dayEvents.slice(0, maxVisible);
                const overflow = Math.max(0, dayEvents.length - maxVisible);
                return (
                  <div className="flex min-w-0 flex-1 flex-col gap-[2px] overflow-hidden">
                    {visible.map((e) => (
                      <span
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onSelectEvent(e);
                        }}
                        className="flex min-w-0 items-center gap-1 rounded-md bg-accent/10 px-1 py-0.5 text-[10px] text-fg transition hover:bg-accent/20 sm:gap-1.5 sm:bg-transparent sm:px-1.5 sm:text-[11px] sm:hover:bg-bg-muted"
                      >
                        <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-accent sm:block" />
                        {!e.allDay && (
                          <span className="hidden font-mono text-[10px] text-fg-subtle sm:inline">
                            {fmt.time(new Date(e.start))}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate">{e.title}</span>
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onSelectDay(d);
                        }}
                        className="self-start cursor-pointer rounded-md bg-fg/8 px-1.5 py-0.5 font-mono text-[9px] text-fg-muted transition hover:bg-fg/14 hover:text-fg sm:text-[10px]"
                      >
                        +{overflow}개
                      </span>
                    )}
                  </div>
                );
              })()}

              {weight !== undefined && !muted && (
                <div className="mt-1 flex max-w-full items-center justify-end gap-0.5 overflow-hidden">
                  {weightDelta !== null && Math.abs(weightDelta) >= 0.05 && (
                    <span
                      className={cn(
                        "shrink-0 rounded px-1 py-px font-mono text-[8px] tabular-nums sm:text-[9px]",
                        weightDelta > 0
                          ? "bg-red-500/10 text-red-500"
                          : "bg-emerald-500/10 text-emerald-600",
                      )}
                      title="전날 대비"
                    >
                      {weightDelta > 0 ? "+" : ""}
                      {weightDelta.toFixed(1)}
                    </span>
                  )}
                  <span
                    className="shrink-0 truncate rounded-md bg-fg/8 px-1 py-px font-mono text-[9px] tabular-nums text-fg-muted sm:px-1.5 sm:py-0.5 sm:text-[10px]"
                    title="체중"
                  >
                    {weight.toFixed(1)}kg
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
