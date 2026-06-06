import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const existing = await prisma.assetEntry.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return new NextResponse("Not Found", { status: 404 });

  await prisma.assetEntry.delete({ where: { id: existing.id } });
  return new NextResponse(null, { status: 204 });
}
