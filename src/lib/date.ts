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
    const esDay = new Date(es.getFullYear(), es.getMonth(), es.getDate()).getTime();
    const eeDay = new Date(ee.getFullYear(), ee.getMonth(), ee.getDate()).getTime();
    const dayMs = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    return esDay <= dayMs && dayMs <= eeDay;
  }
  const ds = new Date(day);
  ds.setHours(0, 0, 0, 0);
  const de = new Date(day);
  de.setHours(23, 59, 59, 999);
  return es <= de && ee > ds;
}
