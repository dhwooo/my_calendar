import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  date: z.string().datetime().optional(),
  kg: z.number().positive().max(400),
  note: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const entries = await prisma.weightEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      kg: e.kg,
      note: e.note,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 입력" }, { status: 400 });
  }
  const { date, kg, note } = parsed.data;

  const entry = await prisma.weightEntry.create({
    data: {
      userId: session.user.id,
      date: date ? new Date(date) : new Date(),
      kg,
      note,
    },
  });

  return NextResponse.json({
    id: entry.id,
    date: entry.date.toISOString(),
    kg: entry.kg,
    note: entry.note,
  });
}
