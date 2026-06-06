import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PatchSchema = z.object({
  text: z.string().min(1).max(280).optional(),
  done: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const body = PatchSchema.parse(await req.json());
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id)
    return new NextResponse("Not Found", { status: 404 });
  const goal = await prisma.goal.update({ where: { id }, data: body });
  return NextResponse.json({ goal });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id)
    return new NextResponse("Not Found", { status: 404 });
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
