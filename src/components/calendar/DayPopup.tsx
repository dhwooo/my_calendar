"use client";

import { format, isSameDay } from "date-fns";
import { Plus, CalendarOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/date";
import { getHoliday } from "@/lib/holidays";
import type { EventDTO } from "@/types/calendar";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date | null;
  events: EventDTO[];
  onAdd: () => void;
  onSelectEvent: (e: EventDTO) => void;
};

export function DayPopup({
  open,
  onOpenChange,
  date,
  events,
  onAdd,
  onSelectEvent,
}: Props) {
  if (!date) return null;
  const day = date.getDay();
  const holiday = getHoliday(date);
  const dayEvents = events
    .filter((e) => {
      const es = new Date(e.start);
      const ee = new Date(e.end);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return es <= end && ee >= start;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const dayLabel =
    day === 0 ? "text-red-500" : day === 6 ? "text-blue-500" : "text-fg-muted";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="border-b border-border/60 bg-gradient-to-br from-[rgb(var(--grad-1))]/8 via-[rgb(var(--grad-2))]/4 to-[rgb(var(--grad-3))]/8 px-6 py-5">
          <div className="flex items-baseline gap-2">
            <DialogTitle className="text-[24px] font-semibold leading-none tracking-tight text-fg">
              {format(date, "M월 d일")}
            </DialogTitle>
            <span className={cn("font-mono text-[11px]", dayLabel)}>
              {format(date, "EEE")}
            </span>
          </div>
          {holiday && (
            <span className="mt-2 inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
              {holiday}
            </span>
          )}
          {isSameDay(date, new Date()) && !holiday && (
            <span className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
              today
            </span>
          )}
        </div>

        {/* Event list */}
        <div className="max-h-[50vh] overflow-y-auto px-3 py-2">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CalendarOff className="h-6 w-6 text-fg-subtle" />
              <p className="text-[13px] text-fg-muted">일정이 없습니다</p>
              <p className="font-mono text-[10px] text-fg-subtle">
                아래 버튼으로 첫 일정 추가
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {dayEvents.map((e) => {
                const es = new Date(e.start);
                const ee = new Date(e.end);
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => onSelectEvent(e)}
                      className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-bg-muted"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {e.mood && (
                            <span className="text-[14px]">{e.mood}</span>
                          )}
                          <span className="truncate text-[14px] font-medium text-fg">
                            {e.title}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-fg-muted">
                          <span>
                            {e.allDay
                              ? "종일"
                              : `${fmt.time(es)} – ${fmt.time(ee)}`}
                          </span>
                          {e.location && (
                            <>
                              <span className="text-fg-subtle">·</span>
                              <span className="truncate">{e.location}</span>
                            </>
                          )}
                          {e.id.startsWith("ical:") && (
                            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600">
                              ICS
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Add button */}
        <div className="border-t border-border/60 bg-bg-subtle/40 px-4 py-3">
          <Button
            onClick={onAdd}
            className="h-10 w-full justify-center gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />새 일정 추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
