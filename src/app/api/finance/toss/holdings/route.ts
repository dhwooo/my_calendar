import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchTossPortfolio } from "@/lib/toss";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      tossClientId: true,
      tossClientSecret: true,
      tossAccountNumber: true,
    },
  });

  if (!user?.tossClientId || !user.tossClientSecret) {
    return NextResponse.json(
      { connected: false, summary: null, holdings: [] },
      { status: 200 },
    );
  }

  try {
    const { summary, holdings } = await fetchTossPortfolio({
      clientId: user.tossClientId,
      clientSecret: user.tossClientSecret,
      accountNumber: user.tossAccountNumber,
    });
    return NextResponse.json({ connected: true, summary, holdings });
  } catch (err) {
    return NextResponse.json(
      {
        connected: true,
        error: (err as Error).message,
        summary: null,
        holdings: [],
      },
      { status: 200 },
    );
  }
}
