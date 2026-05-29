import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: { id: true, expires_at: true },
  });

  return NextResponse.json({
    connected: !!account,
    expiresAt: account?.expires_at ?? null,
  });
}
