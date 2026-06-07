import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { cid } = await params;
  const comment = await prisma.postComment.findUnique({ where: { id: cid } });
  if (!comment) return new NextResponse("Not Found", { status: 404 });
  if (comment.authorId !== session.user.id)
    return new NextResponse("Forbidden", { status: 403 });
  await prisma.postComment.delete({ where: { id: cid } });
  return NextResponse.json({ ok: true });
}
