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
