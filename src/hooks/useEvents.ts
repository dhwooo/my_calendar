"use client";

import useSWR from "swr";
import type { EventDTO, EventInput } from "@/types/calendar";

export function useEvents(range: { start: Date; end: Date }) {
  const key = `/api/calendar/events?from=${range.start.toISOString()}&to=${range.end.toISOString()}`;
  const { data, error, isLoading, mutate } = useSWR<{ events: EventDTO[] }>(key);

  async function refreshIcal() {
    // Force-refresh: bypass server-side cache for ICS feed.
    const res = await fetch(`${key}&refresh=1`);
    if (res.ok) {
      const fresh = (await res.json()) as { events: EventDTO[] };
      await mutate(fresh, { revalidate: false });
    }
  }

  return {
    events: data?.events ?? [],
    isLoading,
    error,
    refresh: mutate,
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
