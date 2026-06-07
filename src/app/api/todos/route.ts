import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const dayKey = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const dateParam = req.nextUrl.searchParams.get("date");
  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");

  const where: {
    userId: string;
    date?: Date | { gte: Date; lte: Date };
  } = { userId: session.user.id };

  if (dateParam) {
    where.date = dayKey(new Date(dateParam));
  } else if (fromParam && toParam) {
    where.date = {
      gte: dayKey(new Date(fromParam)),
      lte: dayKey(new Date(toParam)),
    };
  }

  const todos = await prisma.todo.findMany({
    where,
    orderBy: [{ date: "asc" }, { order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ todos });
}

const CreateSchema = z.object({
  date: z.string(),
  text: z.string().min(1).max(280),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = CreateSchema.parse(await req.json());
  const date = dayKey(new Date(body.date));
  const last = await prisma.todo.findFirst({
    where: { userId: session.user.id, date },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const todo = await prisma.todo.create({
    data: {
      userId: session.user.id,
      date,
      text: body.text,
      order: (last?.order ?? -1) + 1,
    },
  });
  return NextResponse.json({ todo });
}
