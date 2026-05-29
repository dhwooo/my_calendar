import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newImageFilename, uploadImage } from "@/lib/storage";

const uploadSchema = z.object({
  dataUrl: z.string().startsWith("data:image/"),
  caption: z.string().max(140).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const photos = await prisma.photo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    photos: photos.map((p) => ({
      id: p.id,
      url: p.url,
      width: p.width,
      height: p.height,
      caption: p.caption,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const parsed = uploadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 입력" }, { status: 400 });
  }

  const match = parsed.data.dataUrl.match(
    /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/,
  );
  if (!match) {
    return NextResponse.json({ error: "지원하지 않는 형식" }, { status: 400 });
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "파일이 너무 큽니다 (8MB 이하)" }, { status: 413 });
  }

  const filename = newImageFilename(session.user.id, match[1], "photo");
  const contentType = `image/${match[1] === "jpg" ? "jpeg" : match[1]}`;
  const url = await uploadImage(buffer, filename, contentType);

  const photo = await prisma.photo.create({
    data: {
      userId: session.user.id,
      url,
      width: parsed.data.width,
      height: parsed.data.height,
      caption: parsed.data.caption,
    },
  });

  return NextResponse.json({
    id: photo.id,
    url: photo.url,
    width: photo.width,
    height: photo.height,
    caption: photo.caption,
  });
}
