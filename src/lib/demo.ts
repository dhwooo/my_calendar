import { addDays, addHours, setHours, setMinutes, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";

/**
 * Seeds a curated set of sample events around "today" for new demo users.
 * Idempotent: skips when the user already has events.
 */
export async function seedDemoEvents(userId: string) {
  const existing = await prisma.event.count({ where: { userId } });
  if (existing > 0) return 0;

  const today = startOfDay(new Date());

  const at = (dayOffset: number, hour: number, minute = 0) =>
    setMinutes(setHours(addDays(today, dayOffset), hour), minute);

  const samples: Array<{
    title: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
    allDay?: boolean;
  }> = [
    {
      title: "데일리 스탠드업",
      description: "전날 작업 공유 / 오늘 우선순위 정렬",
      location: "Zoom",
      start: at(0, 9, 30),
      end: at(0, 9, 50),
    },
    {
      title: "디자인 리뷰 — 캘린더 v2",
      description: "Apple+Codex 톤, 연간 뷰, 데이트 피커",
      location: "Figma",
      start: at(0, 14, 0),
      end: at(0, 15, 0),
    },
    {
      title: "운동",
      start: at(0, 19, 0),
      end: at(0, 20, 0),
    },
    {
      title: "팀 1:1 — 김매니저",
      start: at(1, 11, 0),
      end: at(1, 11, 30),
    },
    {
      title: "분기 OKR 점검",
      description: "Q3 회고 + Q4 목표 초안",
      start: at(2, 10, 0),
      end: at(2, 12, 0),
    },
    {
      title: "런치 위드 윤다은",
      location: "성수동",
      start: at(2, 12, 30),
      end: at(2, 13, 30),
    },
    {
      title: "프로덕트 데모 발표",
      description: "전 부서 대상 베타 데모",
      location: "본사 7F 라운지",
      start: at(3, 16, 0),
      end: at(3, 17, 0),
    },
    {
      title: "휴가",
      allDay: true,
      start: addDays(today, 6),
      end: addDays(today, 8),
    },
    {
      title: "디자인 시스템 학습",
      description: "shadcn registry / Radix UI primitives",
      start: at(-1, 20, 0),
      end: at(-1, 22, 0),
    },
    {
      title: "주간 회고",
      start: at(4, 17, 0),
      end: addHours(at(4, 17, 0), 1),
    },
  ];

  await prisma.event.createMany({
    data: samples.map((s) => ({
      userId,
      title: s.title,
      description: s.description ?? null,
      location: s.location ?? null,
      start: s.start,
      end: s.end,
      allDay: s.allDay ?? false,
    })),
  });

  return samples.length;
}
