import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const Schema = z.object({ content: z.string().min(1).max(1000) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const body = Schema.parse(await req.json());
  const exists = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return new NextResponse("Not Found", { status: 404 });
  const comment = await prisma.postComment.create({
    data: {
      postId: id,
      authorId: session.user.id,
      content: body.content,
    },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
    },
  });
  return NextResponse.json({ comment });
}
