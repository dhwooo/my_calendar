import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVapid, webpush } from "@/lib/vapid";
import { fetchIcalEvents } from "@/lib/ical";
import type { EventDTO } from "@/types/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron 매일 8am KST(23:00 UTC) 실행.
 * 종일 일정에 대해
 *   - 오늘 분: "오늘 종일 — 제목"
 *   - 내일 분: "내일 종일 — 제목" (전날 알림)
 * 푸시.
 */
export async function GET(req: NextRequest) {
  // Vercel Cron이 자동 주입하는 헤더 확인
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await getVapid();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  const users = await prisma.user.findMany({
    where: { pushSubs: { some: {} } },
    select: { id: true, icalUrl: true },
  });

  const summary: Array<{ userId: string; sent: number }> = [];

  for (const user of users) {
    const dbEvents = await prisma.event.findMany({
      where: {
        userId: user.id,
        allDay: true,
        start: { lte: endOfTomorrow },
        end: { gte: today },
      },
    });

    let icsEvents: EventDTO[] = [];
    if (user.icalUrl) {
      try {
        icsEvents = await fetchIcalEvents(
          user.icalUrl,
          { start: today, end: endOfTomorrow },
          { force: true },
        );
        icsEvents = icsEvents.filter((e) => e.allDay);
      } catch (err) {
        console.warn(`[cron] ical fetch failed for ${user.id}`, err);
      }
    }

    type AllDayEvt = { title: string; start: Date; end: Date };
    const all: AllDayEvt[] = [
      ...dbEvents.map((e) => ({ title: e.title, start: e.start, end: e.end })),
      ...icsEvents.map((e) => ({
        title: e.title,
        start: new Date(e.start),
        end: new Date(e.end),
      })),
    ];

    const startsToday = all.filter(
      (e) => e.start <= today && e.end >= today,
    );
    const startsTomorrow = all.filter(
      (e) => e.start <= tomorrow && e.end >= tomorrow && !(e.start <= today && e.end >= today),
    );

    const subs = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
    });

    let sent = 0;
    for (const evt of startsToday) {
      sent += await pushAll(subs, "오늘 종일 일정", evt.title);
    }
    for (const evt of startsTomorrow) {
      sent += await pushAll(subs, "내일 종일 일정", evt.title);
    }
    summary.push({ userId: user.id, sent });
  }

  return NextResponse.json({ ok: true, summary });
}

async function pushAll(
  subs: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
  title: string,
  body: string,
): Promise<number> {
  const payload = JSON.stringify({ title, body, url: "/calendar" });
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      ),
    ),
  );
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (
      r.status === "rejected" &&
      ((r.reason as { statusCode?: number })?.statusCode === 410 ||
        (r.reason as { statusCode?: number })?.statusCode === 404)
    ) {
      await prisma.pushSubscription.delete({ where: { id: subs[i].id } });
    }
  }
  return results.filter((r) => r.status === "fulfilled").length;
}
