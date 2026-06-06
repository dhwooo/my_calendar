import type { EventDTO } from "@/types/calendar";

type Range = { start: Date; end: Date };

/**
 * Google Calendar의 "Secret address in iCal format" URL fetch + 파싱.
 *
 * @param force true면 Next 캐시 우회 (사용자가 수동 새로고침 누를 때).
 *              기본은 5분 ISR.
 */
export async function fetchIcalEvents(
  url: string,
  range: Range,
  options: { force?: boolean } = {},
): Promise<EventDTO[]> {
  try {
    const res = await fetch(
      url,
      options.force
        ? { cache: "no-store" }
        : { next: { revalidate: 300 } },
    );
    if (!res.ok) {
      console.warn("[ical] fetch failed", res.status, res.statusText);
      return [];
    }
    const ics = await res.text();
    const { default: ical } = await import("node-ical");
    const parsed = ical.sync.parseICS(ics);

    const events: EventDTO[] = [];
    for (const key in parsed) {
      const item = parsed[key];
      if (!item || item.type !== "VEVENT") continue;
      const start = new Date(item.start as Date);
      const end = new Date(item.end as Date);

      const rrule = (item as {
        rrule?: { between: (a: Date, b: Date, inc: boolean) => Date[] };
      }).rrule;
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
    console.log(`[ical] ${events.length} events from ${url.slice(0, 80)}...`);
    return events;
  } catch (err) {
    console.error("[ical] parse error", err);
    return [];
  }
}

function toDTO(
  item: {
    uid?: string;
    summary?: string;
    description?: string;
    location?: string;
    datetype?: string;
  },
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
