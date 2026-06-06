import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newImageFilename, uploadImage } from "@/lib/storage";

const schema = z.object({
  name: z.string().min(1).max(40).optional(),
  imageDataUrl: z.string().startsWith("data:image/").optional(),
  icalUrl: z
    .string()
    .url()
    .max(2000)
    .nullable()
    .optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      email: true,
      icalUrl: true,
    },
  });
  const google = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: { id: true },
  });

  return NextResponse.json({ user, googleConnected: !!google });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "잘못된 입력" }, { status: 400 });

  const updates: { name?: string; image?: string; icalUrl?: string | null } = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.icalUrl !== undefined) updates.icalUrl = parsed.data.icalUrl;

  if (parsed.data.imageDataUrl) {
    const match = parsed.data.imageDataUrl.match(
      /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/,
    );
    if (!match) {
      return NextResponse.json({ error: "지원하지 않는 형식" }, { status: 400 });
    }
    const buffer = Buffer.from(match[2], "base64");
    const filename = newImageFilename(session.user.id, match[1], "avatar");
    const contentType = `image/${match[1] === "jpg" ? "jpeg" : match[1]}`;
    updates.image = await uploadImage(buffer, filename, contentType);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, name: true, image: true },
  });

  return NextResponse.json({ user });
}
