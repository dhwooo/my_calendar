"use client";

import { Plus, Calendar } from "lucide-react";
import { isAfter, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/date";
import type { EventDTO } from "@/types/calendar";

type Props = {
  events: EventDTO[];
  onSelectEvent: (e: EventDTO) => void;
  onCreate: () => void;
};

export function DashboardRail({ events, onSelectEvent, onCreate }: Props) {
  const now = new Date();
  const todayEvents = events
    .filter((e) => isSameDay(new Date(e.start), now))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const upcoming = events
    .filter(
      (e) =>
        isAfter(new Date(e.start), now) && !isSameDay(new Date(e.start), now),
    )
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 6);

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col gap-5 overflow-auto border-l border-border/60 bg-bg-subtle/30 px-5 py-6 xl:flex">
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <h3 className="text-[13px] font-medium tracking-tight text-fg">
            오늘
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            {fmt.dateInput(now)}
          </span>
        </div>
        <p className="mb-3 font-mono text-[10px] text-fg-subtle">
          {todayEvents.length}개의 일정
        </p>
        {todayEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center">
            <Calendar className="mx-auto mb-2 h-5 w-5 text-fg-subtle" />
            <p className="text-[12px] text-fg-muted">오늘 비어 있어요</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 gap-1 text-[12px]"
              onClick={onCreate}
            >
              <Plus className="h-3.5 w-3.5" />
              일정 추가
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => onSelectEvent(e)}
                className="group block w-full rounded-xl border border-border/60 bg-bg/70 px-3 py-2.5 text-left transition hover:border-fg/30 hover:bg-bg-subtle"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="truncate text-[13px] font-medium text-fg">
                    {e.title}
                  </span>
                </div>
                <div className="ml-3.5 mt-0.5 font-mono text-[10px] text-fg-muted">
                  {e.allDay
                    ? "종일"
                    : `${fmt.time(new Date(e.start))} – ${fmt.time(new Date(e.end))}`}
                  {e.location ? ` · ${e.location}` : ""}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-[13px] font-medium tracking-tight text-fg">
          다가오는 일정
        </h3>
        {upcoming.length === 0 ? (
          <p className="font-mono text-[10px] text-fg-subtle">없음</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((e) => {
              const d = new Date(e.start);
              return (
                <button
                  key={e.id}
                  onClick={() => onSelectEvent(e)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-bg-muted"
                >
                  <div className="flex h-9 w-9 flex-col items-center justify-center rounded-lg border border-border/70 bg-bg">
                    <span className="font-mono text-[9px] text-fg-subtle">
                      {fmt.weekday(d)}
                    </span>
                    <span className="font-mono text-[12px] font-medium text-fg">
                      {fmt.day(d)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-fg">
                      {e.title}
                    </div>
                    <div className="font-mono text-[10px] text-fg-muted">
                      {e.allDay ? "종일" : fmt.time(d)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
