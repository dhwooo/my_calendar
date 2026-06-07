"use client";

import useSWR from "swr";
import type { EventDTO, EventInput } from "@/types/calendar";

export function useEvents(range: { start: Date; end: Date }) {
  const qs = `from=${range.start.toISOString()}&to=${range.end.toISOString()}`;
  const dbKey = `/api/calendar/events?${qs}`;
  const icalKey = `/api/calendar/ical?${qs}`;

  // DB 이벤트 — 빠름, 즉시 표시
  const { data: dbData, mutate: mutateDb } = useSWR<{ events: EventDTO[] }>(dbKey);
  // ICS 이벤트 — 늦음, 도착하면 합쳐 표시
  const { data: icalData, mutate: mutateIcal } = useSWR<{ events: EventDTO[] }>(icalKey);

  const dbEvents = dbData?.events ?? [];
  const icalEvents = icalData?.events ?? [];

  const events = [...dbEvents, ...icalEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  async function refreshIcal() {
    const res = await fetch(`${icalKey}&refresh=1`);
    if (res.ok) {
      const fresh = (await res.json()) as { events: EventDTO[] };
      await mutateIcal(fresh, { revalidate: false });
    }
  }

  async function refresh() {
    await Promise.all([mutateDb(), mutateIcal()]);
  }

  return {
    events,
    isLoading: !dbData,
    error: null,
    refresh,
    refreshIcal,
  };
}

export async function createEvent(input: EventInput) {
  const res = await fetch("/api/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("이벤트 생성에 실패했어요");
  return (await res.json()) as EventDTO;
}

export async function updateEvent(id: string, input: EventInput) {
  const res = await fetch(`/api/calendar/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("이벤트 수정에 실패했어요");
  return (await res.json()) as EventDTO;
}

export async function deleteEvent(id: string) {
  const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("이벤트 삭제에 실패했어요");
}

export async function syncFromGoogle(range: { start: Date; end: Date }) {
  const res = await fetch("/api/calendar/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: range.start.toISOString(),
      to: range.end.toISOString(),
    }),
  });
  if (!res.ok) throw new Error("Google 동기화에 실패했어요");
  return (await res.json()) as { pulled: number };
}
