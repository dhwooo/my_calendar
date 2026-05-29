import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  title: z.string().max(120).optional(),
  content: z.string().optional(),
  icon: z.string().max(8).nullable().optional(),
  parentId: z.string().nullable().optional(),
});

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const page = await prisma.wikiPage.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!page) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json({ page });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "잘못된 입력" }, { status: 400 });

  const existing = await prisma.wikiPage.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) return new NextResponse("Not Found", { status: 404 });

  const page = await prisma.wikiPage.update({
    where: { id: existing.id },
    data: parsed.data,
  });
  return NextResponse.json({ page });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const existing = await prisma.wikiPage.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) return new NextResponse("Not Found", { status: 404 });

  await prisma.wikiPage.delete({ where: { id: existing.id } });
  return new NextResponse(null, { status: 204 });
}
