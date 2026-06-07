import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchIcalEvents } from "@/lib/ical";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return new NextResponse("from/to required", { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { icalUrl: true },
  });

  if (!user?.icalUrl) {
    return NextResponse.json({ events: [] });
  }

  const force = searchParams.get("refresh") === "1";
  const events = await fetchIcalEvents(
    user.icalUrl,
    { start: new Date(from), end: new Date(to) },
    { force },
  );

  return NextResponse.json({ events });
}
