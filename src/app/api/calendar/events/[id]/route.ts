import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pushDelete, pushUpdate } from "@/lib/sync";

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

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.event.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) return new NextResponse("Not Found", { status: 404 });

  const event = await prisma.event.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      start: new Date(data.start),
      end: new Date(data.end),
      allDay: data.allDay ?? false,
      mood: data.mood ?? null,
      notifyMinutes: data.notifyMinutes ?? null,
      shared: data.shared ?? false,
      // 알림 설정이 바뀌면 이미 보낸 표시를 초기화
      notifiedAt:
        data.notifyMinutes !== existing.notifyMinutes ? null : existing.notifiedAt,
    },
  });

  try {
    await pushUpdate(session.user.id, event.id);
  } catch (err) {
    console.warn("Google push (update) failed:", err);
  }

  return NextResponse.json({
    ...event,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!event) return new NextResponse("Not Found", { status: 404 });

  if (event.googleId) {
    try {
      await pushDelete(session.user.id, event.googleId, event.calendarId);
    } catch (err) {
      console.warn("Google push (delete) failed:", err);
    }
  }

  await prisma.event.delete({ where: { id: event.id } });
  return new NextResponse(null, { status: 204 });
}
