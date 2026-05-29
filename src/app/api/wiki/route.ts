import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  title: z.string().max(120).optional(),
  parentId: z.string().nullable().optional(),
  icon: z.string().max(8).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const pages = await prisma.wikiPage.findMany({
    where: { userId: session.user.id },
    orderBy: [{ parentId: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      parentId: true,
      title: true,
      icon: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ pages });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  const data = parsed.success ? parsed.data : {};

  const page = await prisma.wikiPage.create({
    data: {
      userId: session.user.id,
      title: data.title ?? "새 페이지",
      parentId: data.parentId ?? null,
      icon: data.icon ?? null,
    },
  });

  return NextResponse.json({ page });
}
