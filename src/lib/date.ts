import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";

export type CalendarRange = { start: Date; end: Date };

export function monthGridRange(anchor: Date): CalendarRange {
  // Week starts Monday — adjust to taste (0 = Sunday).
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  return { start, end };
}

export function weekRange(anchor: Date): CalendarRange {
  return {
    start: startOfWeek(anchor, { weekStartsOn: 1 }),
    end: endOfWeek(anchor, { weekStartsOn: 1 }),
  };
}

export function daysBetween(range: CalendarRange): Date[] {
  const days: Date[] = [];
  let cursor = range.start;
  while (cursor <= range.end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export const fmt = {
  monthYear: (d: Date) => format(d, "yyyy년 M월"),
  weekday: (d: Date) => format(d, "EEE"),
  day: (d: Date) => format(d, "d"),
  time: (d: Date) => format(d, "HH:mm"),
  dateInput: (d: Date) => format(d, "yyyy-MM-dd"),
  timeInput: (d: Date) => format(d, "HH:mm"),
};

export { isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks };

/**
 * 이벤트가 특정 날(day)에 표시되어야 하는지 판단.
 * - 종일(allDay): 시작/종료를 날짜 단위로 비교 (자정 경계로 다음날 새는 거 방지)
 * - 일반 timed: 끝나는 시각이 그 날 0시보다 strict greater여야 함 (DTEND exclusive 관례)
 */
export function eventOnDay(
  ev: { start: string | Date; end: string | Date; allDay?: boolean | null },
  day: Date,
): boolean {
  const es = new Date(ev.start);
  const ee = new Date(ev.end);
  if (ev.allDay) {
    // 종일 이벤트는 서버(UTC)에서 UTC 자정 기준으로 저장됨.
    // 시작/종료의 "날짜 부분"은 UTC로 읽고, 캘린더 day는 로컬로 읽어 비교.
    const esDay = Date.UTC(es.getUTCFullYear(), es.getUTCMonth(), es.getUTCDate());
    const eeDay = Date.UTC(ee.getUTCFullYear(), ee.getUTCMonth(), ee.getUTCDate());
    const dayMs = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
    return esDay <= dayMs && dayMs <= eeDay;
  }
  const ds = new Date(day);
  ds.setHours(0, 0, 0, 0);
  const de = new Date(day);
  de.setHours(23, 59, 59, 999);
  return es <= de && ee > ds;
}
