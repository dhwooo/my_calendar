import { format } from "date-fns";

/**
 * Korean public holidays (fixed solar dates + commonly relevant ones).
 * Lunar holidays (설날, 추석, 부처님오신날) are intentionally simplified:
 * map known years to their actual solar dates rather than computing lunar.
 */
const FIXED_GREGORIAN: Record<string, string> = {
  "01-01": "신정",
  "03-01": "삼일절",
  "05-05": "어린이날",
  "06-06": "현충일",
  "08-15": "광복절",
  "10-03": "개천절",
  "10-09": "한글날",
  "12-25": "성탄절",
};

// Pre-resolved lunar→solar dates per year for major Korean holidays.
const LUNAR_DERIVED: Record<string, string> = {
  // 설날 연휴
  "2025-01-28": "설날 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설날 연휴",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2027-02-06": "설날 연휴",
  "2027-02-07": "설날",
  "2027-02-08": "설날 연휴",
  // 부처님오신날
  "2025-05-05": "부처님오신날",
  "2026-05-24": "부처님오신날",
  "2027-05-13": "부처님오신날",
  // 추석 연휴
  "2025-10-05": "추석 연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석 연휴",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2027-09-14": "추석 연휴",
  "2027-09-15": "추석",
  "2027-09-16": "추석 연휴",
};

export function getHoliday(date: Date): string | null {
  const ymd = format(date, "yyyy-MM-dd");
  if (LUNAR_DERIVED[ymd]) return LUNAR_DERIVED[ymd];
  const md = format(date, "MM-dd");
  return FIXED_GREGORIAN[md] ?? null;
}

export function isHoliday(date: Date): boolean {
  return getHoliday(date) !== null;
}

export function weekdayTone(date: Date) {
  const day = date.getDay(); // 0 Sun, 6 Sat
  if (day === 0 || isHoliday(date))
    return { text: "text-red-500", muted: "text-red-500/40" } as const;
  if (day === 6)
    return { text: "text-blue-500", muted: "text-blue-500/40" } as const;
  return { text: "text-fg", muted: "text-fg-subtle" } as const;
}
