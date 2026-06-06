import type { EventDTO } from "@/types/calendar";

/**
 * Google Calendar의 "Secret address in iCal format" URL을 fetch + 파싱.
 *
 * 사용처: /api/calendar/events GET 에서 사용자가 등록한 URL을 가져와
 *        DB events 리스트와 합쳐서 응답.
 *
 * 캐싱: Next.js fetch 의 revalidate=300 으로 5분간 ISR.
 */
export async function fetchIcalEvents(
  url: string,
  range: { start: Date; end: Date },
): Promise<EventDTO[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const ics = await res.text();
    const { default: ical } = await import("node-ical");
    const parsed = ical.sync.parseICS(ics);

    const events: EventDTO[] = [];
    for (const key in parsed) {
      const item = parsed[key];
      if (!item || item.type !== "VEVENT") continue;
      const start = new Date(item.start as Date);
      const end = new Date(item.end as Date);

      // RRULE 처리 — 반복 일정을 range 내에서 펼침
      const rrule = (item as { rrule?: { between: (a: Date, b: Date, inc: boolean) => Date[] } }).rrule;
      if (rrule) {
        const occurrences = rrule.between(range.start, range.end, true);
        const duration = end.getTime() - start.getTime();
        for (const occ of occurrences) {
          events.push(toDTO(item, occ, new Date(occ.getTime() + duration)));
        }
        continue;
      }

      if (end < range.start || start > range.end) continue;
      events.push(toDTO(item, start, end));
    }
    return events;
  } catch {
    return [];
  }
}

function toDTO(
  item: { uid?: string; summary?: string; description?: string; location?: string; datetype?: string },
  start: Date,
  end: Date,
): EventDTO {
  const allDay =
    item.datetype === "date" ||
    (end.getTime() - start.getTime()) % 86400000 === 0;
  return {
    id: `ical:${item.uid ?? `${start.toISOString()}-${item.summary ?? ""}`}`,
    googleId: null,
    calendarId: "ical",
    title: item.summary ?? "(제목 없음)",
    description: item.description ?? null,
    location: item.location ?? null,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay,
    color: null,
    mood: null,
  };
}
