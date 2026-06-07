import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { seedLinuxMaster } from "@/lib/wiki-seeds";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  if (me?.username !== "dhwoo") {
    return NextResponse.json(
      { error: "이 시드는 본 사용자 전용입니다." },
      { status: 403 },
    );
  }

  const result = await seedLinuxMaster(session.user.id);
  return NextResponse.json(result);
}
