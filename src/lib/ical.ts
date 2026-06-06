import type { EventDTO } from "@/types/calendar";

type Range = { start: Date; end: Date };

/**
 * Google Calendar "Secret address in iCal format" URL → 이벤트 파싱.
 *
 * node-ical은 transitive dep(temporal-polyfill)이 Vercel 빌드에서
 * BigInt 참조가 깨지는 이슈가 있어, 직접 정규식 기반 파싱을 사용.
 * RRULE은 지원하지 않음 (단발성 이벤트만).
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
    const items = parseVEvents(ics);
    const events: EventDTO[] = [];
    for (const it of items) {
      if (!it.start || !it.end) continue;
      if (it.end < range.start || it.start > range.end) continue;
      events.push(toDTO(it));
    }
    console.log(`[ical] ${events.length}/${items.length} events in range`);
    return events;
  } catch (err) {
    console.error("[ical] parse error", err);
    return [];
  }
}

type RawEvent = {
  uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: Date;
  end?: Date;
  allDay?: boolean;
};

/**
 * 줄을 unfolding (RFC 5545: CRLF + 공백/탭 = 다음 줄 이어붙임)하고
 * VEVENT 블록을 추출 → 키:값 파싱.
 */
function parseVEvents(ics: string): RawEvent[] {
  const unfolded = ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);

  const events: RawEvent[] = [];
  let cur: RawEvent | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;

    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const rawKey = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const [name, ...params] = rawKey.split(";");
    const isDateOnly = params.some((p) => /VALUE=DATE\b/.test(p));

    switch (name) {
      case "UID":
        cur.uid = value;
        break;
      case "SUMMARY":
        cur.summary = unescape(value);
        break;
      case "DESCRIPTION":
        cur.description = unescape(value);
        break;
      case "LOCATION":
        cur.location = unescape(value);
        break;
      case "DTSTART":
        cur.start = parseDate(value, isDateOnly);
        cur.allDay = isDateOnly || cur.allDay;
        break;
      case "DTEND":
        cur.end = parseDate(value, isDateOnly);
        cur.allDay = isDateOnly || cur.allDay;
        break;
    }
  }
  return events;
}

function parseDate(value: string, isDateOnly: boolean): Date | undefined {
  // 형식: YYYYMMDD (date) 또는 YYYYMMDDTHHMMSS[Z]
  const m =
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value);
  if (!m) return undefined;
  const [, y, mo, d, h = "0", mi = "0", s = "0", z] = m;
  if (isDateOnly) {
    return new Date(Number(y), Number(mo) - 1, Number(d));
  }
  if (z) {
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  }
  // floating (no timezone) — treat as local
  return new Date(+y, +mo - 1, +d, +h, +mi, +s);
}

function unescape(v: string): string {
  return v
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function toDTO(item: RawEvent): EventDTO {
  const start = item.start!;
  const end = item.end ?? new Date(start.getTime() + 60 * 60 * 1000);
  const allDay =
    item.allDay === true ||
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
