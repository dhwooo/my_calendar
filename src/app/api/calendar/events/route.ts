import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pushCreate } from "@/lib/sync";
import { fetchIcalEvents } from "@/lib/ical";

const inputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  allDay: z.boolean().optional(),
  mood: z.string().nullable().optional(),
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

  const [events, user] = await Promise.all([
    prisma.event.findMany({
      where: {
        userId: session.user.id,
        start: { lte: toDate },
        end: { gte: fromDate },
      },
      orderBy: { start: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { icalUrl: true },
    }),
  ]);

  const localEvents = events.map((e) => ({
    ...e,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
  }));

  const force = searchParams.get("refresh") === "1";
  const icalEvents = user?.icalUrl
    ? await fetchIcalEvents(
        user.icalUrl,
        { start: fromDate, end: toDate },
        { force },
      )
    : [];

  return NextResponse.json({
    events: [...localEvents, ...icalEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    ),
  });
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
