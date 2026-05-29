import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  date: z.string().datetime().optional(),
  label: z.string().min(1).max(40),
  amount: z.number().int(),
  category: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const entries = await prisma.assetEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      label: e.label,
      amount: e.amount,
      category: e.category,
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

  const entry = await prisma.assetEntry.create({
    data: {
      userId: session.user.id,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      label: parsed.data.label,
      amount: parsed.data.amount,
      category: parsed.data.category,
    },
  });

  return NextResponse.json({
    id: entry.id,
    date: entry.date.toISOString(),
    label: entry.label,
    amount: entry.amount,
    category: entry.category,
  });
}
