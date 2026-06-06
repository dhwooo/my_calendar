"use client";

import { addMonths, format, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import {
  daysBetween,
  fmt,
  isSameDay,
  isSameMonth,
  monthGridRange,
} from "@/lib/date";
import { isHoliday } from "@/lib/holidays";
import type { EventDTO } from "@/types/calendar";

type Props = {
  anchor: Date;
  events: EventDTO[];
  onSelectMonth: (d: Date) => void;
};

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];

function dayHasEvents(day: Date, events: EventDTO[]) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return events.some((e) => {
    const es = new Date(e.start);
    const ee = new Date(e.end);
    return es <= end && ee > start;
  });
}

function MiniMonth({
  monthDate,
  events,
  onClick,
}: {
  monthDate: Date;
  events: EventDTO[];
  onClick: () => void;
}) {
  const days = daysBetween(monthGridRange(monthDate));
  const today = new Date();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-bg-subtle/40 p-4 text-left transition hover:border-fg/30 hover:bg-bg-subtle/80"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-[14px] font-medium tracking-tight text-fg">
          {format(monthDate, "M월")}
        </h3>
        <span className="font-mono text-[10px] text-fg-subtle">
          {format(monthDate, "yyyy")}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-y-[2px] text-center">
        {WEEK.map((w, i) => (
          <span
            key={w}
            className={cn(
              "font-mono text-[9px] uppercase",
              i === 5 || i === 6 ? "text-fg-subtle/70" : "text-fg-subtle",
            )}
          >
            {w}
          </span>
        ))}
        {days.map((d) => {
          const muted = !isSameMonth(d, monthDate);
          const isToday = isSameDay(d, today);
          const has = !muted && dayHasEvents(d, events);
          const day = d.getDay();
          const holiday = !muted && isHoliday(d);
          const isSun = day === 0;
          const isSat = day === 6;
          return (
            <span
              key={d.toISOString()}
              className={cn(
                "relative mx-auto flex h-5 w-5 items-center justify-center font-mono text-[10px]",
                muted ? "text-fg-subtle/50" : "text-fg-muted",
                !muted && (holiday || isSun) && "text-red-500/90",
                !muted && !holiday && isSat && "text-blue-500/90",
                isToday &&
                  !muted &&
                  "rounded-full bg-accent !text-accent-fg",
              )}
            >
              {format(d, "d")}
              {has && !isToday && (
                <span className="absolute -bottom-[1px] h-[3px] w-[3px] rounded-full bg-accent/70" />
              )}
            </span>
          );
        })}
      </div>
    </button>
  );
}

export function YearView({ anchor, events, onSelectMonth }: Props) {
  const yearStart = startOfYear(anchor);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

  return (
    <div className="overflow-auto px-6 pb-10 sm:px-8">
      <div className="mb-5 flex items-baseline gap-3 px-1">
        <h2 className="text-gradient text-[34px] font-semibold leading-none tracking-tight">
          {fmt.monthYear(yearStart).split(" ")[0]}
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          year overview
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((m) => (
          <MiniMonth
            key={m.toISOString()}
            monthDate={m}
            events={events}
            onClick={() => onSelectMonth(m)}
          />
        ))}
      </div>
    </div>
  );
}
