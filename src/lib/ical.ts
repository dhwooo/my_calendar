import type { EventDTO } from "@/types/calendar";

type Range = { start: Date; end: Date };

/**
 * Google Calendar "Secret address in iCal format" URL → 이벤트 파싱.
 * 정규식 기반 파서 (node-ical/temporal-polyfill의 Vercel 빌드 BigInt 이슈 회피).
 * 기본 RRULE (DAILY/WEEKLY/MONTHLY/YEARLY + INTERVAL/UNTIL/COUNT/BYDAY) 지원.
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
      if (!it.start) continue;
      const baseEnd = it.end ?? new Date(it.start.getTime() + 60 * 60 * 1000);
      const duration = baseEnd.getTime() - it.start.getTime();

      if (it.rrule) {
        const occs = expandRRule(it.start, it.rrule, it.exdates ?? [], range);
        for (const occStart of occs) {
          const occEnd = new Date(occStart.getTime() + duration);
          events.push(toDTO(it, occStart, occEnd));
        }
        continue;
      }

      if (baseEnd < range.start || it.start > range.end) continue;
      events.push(toDTO(it, it.start, baseEnd));
    }
    console.log(`[ical] ${events.length} events from ${items.length} vevents`);
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
  rrule?: Map<string, string>;
  exdates?: Date[];
};

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
      if (cur) {
        if (cur.allDay && cur.end) {
          cur.end = new Date(cur.end.getTime() - 1);
        }
        events.push(cur);
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const rawKey = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const [name, ...params] = rawKey.split(";");
    const isDateOnly = params.some((p) => p === "VALUE=DATE");

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
      case "RRULE": {
        const map = new Map<string, string>();
        for (const part of value.split(";")) {
          const [k, v] = part.split("=");
          if (k && v) map.set(k, v);
        }
        cur.rrule = map;
        break;
      }
      case "EXDATE": {
        const dates = value.split(",").map((v) => parseDate(v, isDateOnly));
        cur.exdates = (cur.exdates ?? []).concat(
          dates.filter((d): d is Date => !!d),
        );
        break;
      }
    }
  }
  return events;
}

function parseDate(value: string, isDateOnly: boolean): Date | undefined {
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
  return new Date(+y, +mo - 1, +d, +h, +mi, +s);
}

const BYDAY_TO_NUM: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

function expandRRule(
  start: Date,
  rrule: Map<string, string>,
  exdates: Date[],
  range: Range,
): Date[] {
  const freq = rrule.get("FREQ");
  if (!freq) return [];
  const interval = parseInt(rrule.get("INTERVAL") ?? "1", 10) || 1;
  const untilStr = rrule.get("UNTIL");
  const until = untilStr ? parseDate(untilStr, !untilStr.includes("T")) : null;
  const count = rrule.get("COUNT") ? parseInt(rrule.get("COUNT")!, 10) : Infinity;
  const byday = rrule.get("BYDAY")?.split(",").map((s) => s.replace(/^[+-]?\d*/, ""));

  const exSet = new Set(exdates.map((d) => d.getTime()));
  const occs: Date[] = [];
  const hardCap = until
    ? new Date(Math.min(until.getTime(), range.end.getTime() + 86400000))
    : new Date(range.end.getTime() + 86400000);

  let n = 0;
  // WEEKLY w/ BYDAY: iterate days within each week instead of base date
  if (freq === "WEEKLY" && byday && byday.length > 0) {
    const dayNums = byday
      .map((d) => BYDAY_TO_NUM[d])
      .filter((d) => d !== undefined)
      .sort((a, b) => a - b);
    // walk week-by-week from start
    const weekStart = new Date(start);
    weekStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
    // align to start's week
    while (weekStart <= hardCap && n < count) {
      for (const dn of dayNums) {
        const candidate = new Date(weekStart);
        const delta = (dn - weekStart.getDay() + 7) % 7;
        candidate.setDate(weekStart.getDate() + delta);
        if (candidate < start) continue;
        if (until && candidate > until) break;
        if (n >= count) break;
        if (candidate >= range.start && candidate <= range.end) {
          if (!exSet.has(candidate.getTime())) occs.push(candidate);
        }
        n++;
      }
      weekStart.setDate(weekStart.getDate() + 7 * interval);
    }
    return occs;
  }

  let cur = new Date(start);
  while (cur <= hardCap && n < count) {
    if (until && cur > until) break;
    if (cur >= range.start && cur <= range.end) {
      if (!exSet.has(cur.getTime())) occs.push(new Date(cur));
    }
    n++;
    if (freq === "DAILY") cur.setDate(cur.getDate() + interval);
    else if (freq === "WEEKLY") cur.setDate(cur.getDate() + 7 * interval);
    else if (freq === "MONTHLY") cur.setMonth(cur.getMonth() + interval);
    else if (freq === "YEARLY") cur.setFullYear(cur.getFullYear() + interval);
    else break;
    if (occs.length > 2000) break; // safety
  }
  return occs;
}

function unescape(v: string): string {
  return v
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function toDTO(item: RawEvent, start: Date, end: Date): EventDTO {
  const allDay =
    item.allDay === true ||
    (end.getTime() - start.getTime()) % 86400000 === 0;
  return {
    id: `ical:${item.uid ?? `${start.toISOString()}-${item.summary ?? ""}`}:${start.getTime()}`,
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
