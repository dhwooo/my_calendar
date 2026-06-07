import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pushCreate } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  allDay: z.boolean().optional(),
  mood: z.string().nullable().optional(),
  notifyMinutes: z.number().int().nullable().optional(),
  shared: z.boolean().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return new NextResponse("from/to required", { status: 400 });

  const fromDate = new Date(from);
  const toDate = new Date(to);

  // DB만 빠르게 반환. ICS는 별도 엔드포인트로 분리(/api/calendar/ical).
  // 본인 일정 OR 공용 일정(shared=true).
  const events = await prisma.event.findMany({
    where: {
      OR: [{ userId: session.user.id }, { shared: true }],
      start: { lte: toDate },
      end: { gte: fromDate },
    },
    orderBy: { start: "asc" },
  });

  const localEvents = events.map((e) => ({
    ...e,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
  }));

  return NextResponse.json({ events: localEvents });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const data = parsed.data;

  const event = await prisma.event.create({
    data: {
      userId: session.user.id,
      title: data.title,
      description: data.description,
      location: data.location,
      start: new Date(data.start),
      end: new Date(data.end),
      allDay: data.allDay ?? false,
      mood: data.mood ?? null,
      notifyMinutes: data.notifyMinutes ?? null,
      shared: data.shared ?? false,
    },
  });

  // Best-effort push to Google. Don't fail the request if Google is down.
  try {
    await pushCreate(session.user.id, event.id);
  } catch (err) {
    console.warn("Google push (create) failed:", err);
  }

  const fresh = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
  return NextResponse.json({
    ...fresh,
    start: fresh.start.toISOString(),
    end: fresh.end.toISOString(),
  });
}
