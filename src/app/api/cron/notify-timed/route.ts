import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVapid, webpush } from "@/lib/vapid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 매 15분 실행. notifyMinutes가 설정된 이벤트 중
 * (start - notifyMinutes minutes) 가 지난 15분 안에 있으면 푸시.
 * notifiedAt이 있으면 스킵.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await getVapid();

  const now = new Date();
  const windowAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // 후보: notifyMinutes != null AND notifiedAt == null AND start >= now (혹은 가까운 미래)
  // 단순화: 후보 범위를 [now, now + 2일] 로 잡고 client-side에서 notifyAt 계산
  const upper = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const candidates = await prisma.event.findMany({
    where: {
      notifyMinutes: { not: null },
      notifiedAt: null,
      start: { gte: windowAgo, lte: upper },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      start: true,
      notifyMinutes: true,
    },
  });

  const subsByUser = new Map<
    string,
    Array<{ id: string; endpoint: string; p256dh: string; auth: string }>
  >();

  let sent = 0;
  for (const e of candidates) {
    const notifyAt = new Date(e.start.getTime() - (e.notifyMinutes ?? 0) * 60 * 1000);
    if (notifyAt > now) continue; // 아직 알릴 시각 안 됨
    if (notifyAt < windowAgo) continue; // 너무 오래 지남 (놓침) — 그래도 보낼지? 그냥 한 번은 보내자
    // 위 조건: 지난 15분 안에 알림 시각이 들어옴 → 발송

    if (!subsByUser.has(e.userId)) {
      const subs = await prisma.pushSubscription.findMany({
        where: { userId: e.userId },
      });
      subsByUser.set(e.userId, subs);
    }
    const subs = subsByUser.get(e.userId)!;
    if (subs.length === 0) {
      await prisma.event.update({
        where: { id: e.id },
        data: { notifiedAt: now },
      });
      continue;
    }

    const min = e.notifyMinutes ?? 0;
    const whenLabel =
      min === 0
        ? "정각"
        : min >= 1440
          ? `${Math.round(min / 1440)}일 전`
          : min >= 60
            ? `${Math.round(min / 60)}시간 전`
            : `${min}분 전`;
    const payload = JSON.stringify({
      title: `${whenLabel} 알림`,
      body: e.title,
      url: "/calendar",
    });

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        ),
      ),
    );
    sent += results.filter((r) => r.status === "fulfilled").length;
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

    await prisma.event.update({
      where: { id: e.id },
      data: { notifiedAt: now },
    });
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    sent,
  });
}
