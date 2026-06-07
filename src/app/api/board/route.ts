import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newImageFilename, uploadImage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      images: { orderBy: { order: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
        },
      },
    },
    take: 100,
  });
  return NextResponse.json({ posts });
}

const CreateSchema = z.object({
  content: z.string().max(4000),
  images: z
    .array(z.string().startsWith("data:image/"))
    .max(8)
    .optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  if (!data.content.trim() && (!data.images || data.images.length === 0)) {
    return NextResponse.json({ error: "내용 또는 이미지가 필요해요." }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      authorId: session.user.id,
      content: data.content,
    },
  });

  if (data.images && data.images.length > 0) {
    for (let i = 0; i < data.images.length; i++) {
      const dataUrl = data.images[i];
      const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/);
      if (!match) continue;
      const buffer = Buffer.from(match[2], "base64");
      const filename = newImageFilename(session.user.id, match[1], "post");
      const contentType = `image/${match[1] === "jpg" ? "jpeg" : match[1]}`;
      const url = await uploadImage(buffer, filename, contentType);
      await prisma.postImage.create({
        data: { postId: post.id, url, order: i },
      });
    }
  }

  const full = await prisma.post.findUnique({
    where: { id: post.id },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      images: { orderBy: { order: "asc" } },
      comments: true,
    },
  });
  return NextResponse.json({ post: full });
}
