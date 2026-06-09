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
  targetWeightKg: z.number().min(20).max(300).nullable().optional(),
  boardNotify: z.boolean().optional(),
  tossClientId: z.string().max(200).nullable().optional(),
  tossClientSecret: z.string().max(500).nullable().optional(),
  tossAccountNumber: z.string().max(50).nullable().optional(),
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
      targetWeightKg: true,
      boardNotify: true,
      tossClientId: true,
      tossAccountNumber: true,
      // tossClientSecret 은 응답에 포함 X (마스킹)
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

  const updates: {
    name?: string;
    image?: string;
    icalUrl?: string | null;
    targetWeightKg?: number | null;
    boardNotify?: boolean;
    tossClientId?: string | null;
    tossClientSecret?: string | null;
    tossAccountNumber?: string | null;
  } = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.icalUrl !== undefined) updates.icalUrl = parsed.data.icalUrl;
  if (parsed.data.targetWeightKg !== undefined)
    updates.targetWeightKg = parsed.data.targetWeightKg;
  if (parsed.data.boardNotify !== undefined)
    updates.boardNotify = parsed.data.boardNotify;
  if (parsed.data.tossClientId !== undefined)
    updates.tossClientId = parsed.data.tossClientId;
  if (parsed.data.tossClientSecret !== undefined)
    updates.tossClientSecret = parsed.data.tossClientSecret;
  if (parsed.data.tossAccountNumber !== undefined)
    updates.tossAccountNumber = parsed.data.tossAccountNumber;

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
