"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { format, isSameDay } from "date-fns";
import { Plus, CalendarOff, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eventOnDay, fmt } from "@/lib/date";
import { getHoliday } from "@/lib/holidays";
import type { EventDTO } from "@/types/calendar";

type Todo = { id: string; date: string; text: string; done: boolean; order: number };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date | null;
  events: EventDTO[];
  weightKg?: number | null;
  onAdd: () => void;
  onSelectEvent: (e: EventDTO) => void;
};

export function DayPopup({
  open,
  onOpenChange,
  date,
  events,
  weightKg,
  onAdd,
  onSelectEvent,
}: Props) {
  if (!date) return null;
  const day = date.getDay();
  const holiday = getHoliday(date);
  const dayEvents = events
    .filter((e) => eventOnDay(e, date))
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
          <div className="mt-2 flex flex-wrap gap-1.5">
            {holiday && (
              <span className="inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
                {holiday}
              </span>
            )}
            {weightKg != null && (
              <span className="inline-block rounded-full bg-fg/8 px-2 py-0.5 font-mono text-[10px] tabular-nums text-fg-muted">
                ⚖︎ {weightKg.toFixed(1)}kg
              </span>
            )}
          </div>
          {isSameDay(date, new Date()) && !holiday && (
            <span className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
              today
            </span>
          )}
        </div>

        {/* Event list + TODO */}
        <div className="max-h-[60vh] overflow-y-auto px-3 py-2">
          <div className="mb-1 flex items-center gap-2 px-2 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
              events
            </span>
            <span className="font-mono text-[10px] text-fg-subtle">
              {dayEvents.length}
            </span>
          </div>
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-4 text-center">
              <CalendarOff className="h-5 w-5 text-fg-subtle" />
              <p className="text-[12px] text-fg-muted">일정 없음</p>
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

          <DayTodoSection date={date} />
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

function DayTodoSection({ date }: { date: Date }) {
  const dateStr = format(date, "yyyy-MM-dd");
  const key = `/api/todos?date=${dateStr}`;
  const { data } = useSWR<{ todos: Todo[] }>(key);
  const todos = data?.todos ?? [];
  const [text, setText] = React.useState("");
  const doneCount = todos.filter((t) => t.done).length;

  const add = async () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    await fetch("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: dateStr, text: v }),
    });
    mutate(key);
  };
  const toggle = async (t: Todo) => {
    await fetch(`/api/todos/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
    mutate(key);
  };
  const remove = async (t: Todo) => {
    await fetch(`/api/todos/${t.id}`, { method: "DELETE" });
    mutate(key);
  };

  return (
    <div className="mt-3 border-t border-border/40 pt-3">
      <div className="mb-1 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            todo
          </span>
          {todos.length > 0 && (
            <span className="font-mono text-[10px] text-fg-subtle">
              {doneCount}/{todos.length}
            </span>
          )}
        </div>
      </div>
      <div className="mb-1 flex gap-2 px-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="할 일 입력 + Enter"
          className="h-9 flex-1 rounded-lg border border-border/60 bg-bg-subtle/40 px-3 text-[13px] outline-none focus:border-accent/60 focus:bg-bg"
        />
        <Button
          onClick={add}
          variant="outline"
          className="h-9 gap-1 rounded-lg px-2 text-[12px]"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {todos.length === 0 ? (
        <p className="px-2 py-2 font-mono text-[10px] text-fg-subtle">
          할 일 없음
        </p>
      ) : (
        <ul className="space-y-0.5">
          {todos.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg-muted"
            >
              <button
                onClick={() => toggle(t)}
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border",
                  t.done
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border hover:border-fg/40",
                )}
              >
                {t.done && (
                  <svg viewBox="0 0 20 20" className="h-3 w-3">
                    <path
                      d="M5 10.5l3.5 3.5L15 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-[13px]",
                  t.done ? "text-fg-subtle line-through" : "text-fg",
                )}
              >
                {t.text}
              </span>
              <button
                onClick={() => remove(t)}
                className="rounded-md p-1 text-fg-subtle opacity-0 hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                aria-label="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
