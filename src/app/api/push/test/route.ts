import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getVapid, webpush } from "@/lib/vapid";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  await getVapid();

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id },
  });
  if (subs.length === 0) {
    return NextResponse.json({ error: "구독된 디바이스가 없습니다." }, { status: 400 });
  }

  const payload = JSON.stringify({
    title: "dhwoo · calendar",
    body: "알림이 잘 도착했어요. 🎉",
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

  // Remove dead subscriptions (410 gone, 404)
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (
      r.status === "rejected" &&
      (r.reason?.statusCode === 410 || r.reason?.statusCode === 404)
    ) {
      await prisma.pushSubscription.delete({ where: { id: subs[i].id } });
    }
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, total: subs.length });
}
