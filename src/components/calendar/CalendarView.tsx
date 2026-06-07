"use client";

import * as React from "react";
import useSWR from "swr";
import { addYears, format, subYears } from "date-fns";
import { X } from "lucide-react";
import {
  addMonths,
  addWeeks,
  monthGridRange,
  subMonths,
  subWeeks,
  weekRange,
} from "@/lib/date";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toolbar } from "@/components/calendar/Toolbar";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { YearView } from "@/components/calendar/YearView";
import { EventModal } from "@/components/calendar/EventModal";
import { EventDetailsPopup } from "@/components/calendar/EventDetailsPopup";
import { DayPopup } from "@/components/calendar/DayPopup";
import { DashboardRail } from "@/components/calendar/DashboardRail";
import { GoalStrip } from "@/components/calendar/GoalStrip";
import { Button } from "@/components/ui/button";
import {
  createEvent,
  deleteEvent,
  updateEvent,
  useEvents,
} from "@/hooks/useEvents";
import type { CalendarView, EventDTO } from "@/types/calendar";
import { startOfYear, endOfYear } from "date-fns";

function rangeForView(view: CalendarView, anchor: Date) {
  switch (view) {
    case "year":
      return { start: startOfYear(anchor), end: endOfYear(anchor) };
    case "week":
      return weekRange(anchor);
    case "day": {
      const s = new Date(anchor);
      s.setHours(0, 0, 0, 0);
      const e = new Date(anchor);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    default:
      return monthGridRange(anchor);
  }
}

export function CalendarShell() {
  const [view, setView] = React.useState<CalendarView>("month");
  const [anchor, setAnchor] = React.useState<Date>(() => new Date());
  const [selected, setSelected] = React.useState<Date>(() => new Date());
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EventDTO | null>(null);
  const [detail, setDetail] = React.useState<EventDTO | null>(null);
  const [dayPopupDate, setDayPopupDate] = React.useState<Date | null>(null);
  const [navOpen, setNavOpen] = React.useState(false);

  const range = rangeForView(view, anchor);
  const { events, refresh, refreshIcal } = useEvents(range);

  // Weight entries — for displaying kg badges on calendar days.
  const { data: weightData } = useSWR<{
    entries: Array<{ id: string; date: string; kg: number }>;
  }>("/api/weight");

  // Todos in current view range — for indicator on day cells.
  const todosKey = `/api/todos?from=${range.start.toISOString()}&to=${range.end.toISOString()}`;
  const { data: todoData } = useSWR<{
    todos: Array<{ id: string; date: string; done: boolean }>;
  }>(todosKey);
  const todosByDate = React.useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const t of todoData?.todos ?? []) {
      const key = format(new Date(t.date), "yyyy-MM-dd");
      const entry = map.get(key) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (t.done) entry.done += 1;
      map.set(key, entry);
    }
    return map;
  }, [todoData]);
  const weightByDate = React.useMemo(() => {
    const map = new Map<string, { kg: number; delta: number | null }>();
    const sorted = [...(weightData?.entries ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let prevKg: number | null = null;
    for (const w of sorted) {
      const key = format(new Date(w.date), "yyyy-MM-dd");
      map.set(key, {
        kg: w.kg,
        delta: prevKg == null ? null : w.kg - prevKg,
      });
      prevKg = w.kg;
    }
    return map;
  }, [weightData]);

  const navigate = (dir: 1 | -1) => {
    setAnchor((d) => {
      if (view === "year") return dir > 0 ? addYears(d, 1) : subYears(d, 1);
      if (view === "month") return dir > 0 ? addMonths(d, 1) : subMonths(d, 1);
      if (view === "week") return dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1);
      const n = new Date(d);
      n.setDate(n.getDate() + dir);
      return n;
    });
  };

  const openCreate = (date?: Date) => {
    setEditing(null);
    if (date) setSelected(date);
    setModalOpen(true);
  };

  const openDetail = (event: EventDTO) => {
    setDetail(event);
  };

  const openEditFromDetail = () => {
    if (!detail) return;
    setEditing(detail);
    setDetail(null);
    setModalOpen(true);
  };

  const sidebar = (
    <Sidebar
      anchor={anchor}
      selected={selected}
      onSelect={(d) => {
        setSelected(d);
        setAnchor(d);
        setNavOpen(false);
      }}
      onCreate={() => {
        openCreate(selected);
        setNavOpen(false);
      }}
      onRefreshIcal={refreshIcal}
    />
  );

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] flex-col bg-bg anim-fade-in">
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* desktop sidebar */}
        <div className="hidden md:block">{sidebar}</div>

        {/* mobile drawer */}
        {navOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              aria-label="닫기"
              onClick={() => setNavOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex">
              {sidebar}
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-12 top-3 text-white"
                aria-label="닫기"
                onClick={() => setNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Toolbar
            anchor={anchor}
            view={view}
            onPrev={() => navigate(-1)}
            onNext={() => navigate(1)}
            onToday={() => {
              const t = new Date();
              setAnchor(t);
              setSelected(t);
            }}
            onViewChange={setView}
            onOpenMobileNav={() => setNavOpen(true)}
          />

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-auto">
              {view === "year" && (
                <YearView
                  anchor={anchor}
                  events={events}
                  onSelectMonth={(d) => {
                    setAnchor(d);
                    setView("month");
                  }}
                />
              )}
              {view === "month" && (
                <>
                  <GoalStrip
                    year={anchor.getFullYear()}
                    month={anchor.getMonth() + 1}
                  />
                  <MonthView
                    anchor={anchor}
                    selected={selected}
                    events={events}
                    weightByDate={weightByDate}
                    todosByDate={todosByDate}
                    onSelectDay={(d) => {
                      setSelected(d);
                      setDayPopupDate(d);
                    }}
                    onSelectEvent={openDetail}
                  />
                </>
              )}
              {view === "week" && (
                <WeekView
                  anchor={anchor}
                  events={events}
                  onSelectEvent={openDetail}
                />
              )}
              {view === "day" && (
                <DayView
                  anchor={anchor}
                  events={events}
                  onSelectEvent={openDetail}
                />
              )}
            </div>

            {/* Dashboard rail (>= xl) */}
            <DashboardRail
              events={events}
              onSelectEvent={openDetail}
              onCreate={() => openCreate()}
            />
          </div>
        </main>
      </div>

      <DayPopup
        open={!!dayPopupDate}
        onOpenChange={(v) => !v && setDayPopupDate(null)}
        date={dayPopupDate}
        events={events}
        weightKg={
          dayPopupDate
            ? weightByDate.get(format(dayPopupDate, "yyyy-MM-dd")) ?? null
            : null
        }
        onAdd={() => {
          const d = dayPopupDate;
          setDayPopupDate(null);
          openCreate(d ?? undefined);
        }}
        onSelectEvent={(e) => {
          setDayPopupDate(null);
          openDetail(e);
        }}
      />

      <EventDetailsPopup
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
        event={detail}
        onEdit={openEditFromDetail}
        onDelete={async () => {
          if (!detail) return;
          const id = detail.id;
          await refresh(
            async () => {
              await deleteEvent(id);
              return { events: events.filter((e) => e.id !== id) };
            },
            {
              optimisticData: { events: events.filter((e) => e.id !== id) },
              rollbackOnError: true,
              revalidate: false,
            },
          );
        }}
      />

      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultDate={selected}
        event={editing}
        onSave={async (input) => {
          if (editing) {
            // Optimistic update
            const updatedPreview = { ...editing, ...input } as EventDTO;
            await refresh(
              async () => {
                const updated = await updateEvent(editing.id, input);
                return {
                  events: events.map((e) =>
                    e.id === editing.id ? updated : e,
                  ),
                };
              },
              {
                optimisticData: {
                  events: events.map((e) =>
                    e.id === editing.id ? updatedPreview : e,
                  ),
                },
                rollbackOnError: true,
                revalidate: false,
              },
            );
          } else {
            const tempId = `tmp-${Date.now()}`;
            const optimistic: EventDTO = {
              id: tempId,
              googleId: null,
              calendarId: "primary",
              title: input.title,
              description: input.description ?? null,
              location: input.location ?? null,
              start: input.start,
              end: input.end,
              allDay: input.allDay ?? false,
              color: null,
              mood: input.mood ?? null,
            };
            await refresh(
              async () => {
                const created = await createEvent(input);
                return {
                  events: [...events.filter((e) => e.id !== tempId), created],
                };
              },
              {
                optimisticData: { events: [...events, optimistic] },
                rollbackOnError: true,
                revalidate: false,
              },
            );
          }
        }}
        onDelete={
          editing
            ? async () => {
                await refresh(
                  async () => {
                    await deleteEvent(editing.id);
                    return {
                      events: events.filter((e) => e.id !== editing.id),
                    };
                  },
                  {
                    optimisticData: {
                      events: events.filter((e) => e.id !== editing.id),
                    },
                    rollbackOnError: true,
                    revalidate: false,
                  },
                );
              }
            : undefined
        }
      />
    </div>
  );
}
