import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(40),
  username: z
    .string()
    .min(2)
    .max(24)
    .regex(/^[a-z0-9_.-]+$/i, "영문/숫자/._-만 사용할 수 있어요"),
  pin: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "PIN은 숫자 6자리여야 합니다"),
});

export async function POST(req: Request) {
  // SINGLE-USER ENFORCEMENT: once a user exists, sign-up is closed forever.
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "가입이 마감되었습니다." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." },
      { status: 400 },
    );
  }

  const { name, pin } = parsed.data;
  const username = parsed.data.username.toLowerCase();

  const passwordHash = await bcrypt.hash(pin, 12);
  await prisma.user.create({
    data: { name, username, passwordHash },
  });

  return NextResponse.json({ ok: true });
}
