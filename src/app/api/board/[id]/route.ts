import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return new NextResponse("Not Found", { status: 404 });
  if (post.authorId !== session.user.id)
    return new NextResponse("Forbidden", { status: 403 });
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
