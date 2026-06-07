import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newImageFilename, uploadImage } from "@/lib/storage";
import { getVapid, webpush } from "@/lib/vapid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const posts = await prisma.post.findMany({
    where: category ? { category } : undefined,
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
  category: z.string().max(20).optional(),
  images: z
    .array(z.string().startsWith("data:image/"))
    .max(20)
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
      category: data.category || "일반",
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

  // 다른 유저에게 푸시 알림
  try {
    await getVapid();
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, username: true },
    });
    // boardNotify=true인 다른 유저의 구독만
    const otherSubs = await prisma.pushSubscription.findMany({
      where: {
        userId: { not: session.user.id },
        user: { boardNotify: true },
      },
    });
    if (otherSubs.length > 0) {
      const authorName = author?.name ?? author?.username ?? "누군가";
      const preview = data.content.slice(0, 60) || "사진 게시물";
      const payload = JSON.stringify({
        title: `${authorName} 님의 새 게시물`,
        body: preview,
        url: "/board",
      });
      await Promise.allSettled(
        otherSubs.map((s) =>
          webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          ),
        ),
      );
    }
  } catch (err) {
    console.warn("[board] push notify failed", err);
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
