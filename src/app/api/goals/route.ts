import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const year = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id, year },
    orderBy: [{ month: "asc" }, { order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ goals });
}

const CreateSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12).nullable().optional(),
  text: z.string().min(1).max(280),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const body = CreateSchema.parse(await req.json());
  const last = await prisma.goal.findFirst({
    where: {
      userId: session.user.id,
      year: body.year,
      month: body.month ?? null,
    },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
      year: body.year,
      month: body.month ?? null,
      text: body.text,
      order: (last?.order ?? -1) + 1,
    },
  });
  return NextResponse.json({ goal });
}
