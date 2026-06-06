import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * ICS 구독 디버그 — URL이 잘 들어왔는지 / fetch가 되는지 / 파싱 결과가 어떤지.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { icalUrl: true },
  });

  if (!user?.icalUrl) {
    return NextResponse.json({
      step: "no-url",
      message: "프로필에서 ICS URL을 먼저 저장하세요.",
    });
  }

  const urlPreview = user.icalUrl.slice(0, 60) + "...";

  let res: Response;
  try {
    res = await fetch(user.icalUrl, { cache: "no-store" });
  } catch (err) {
    return NextResponse.json({
      step: "fetch-failed",
      url: urlPreview,
      error: String(err),
    });
  }

  if (!res.ok) {
    return NextResponse.json({
      step: "http-error",
      url: urlPreview,
      status: res.status,
      statusText: res.statusText,
    });
  }

  const ics = await res.text();
  const lines = ics.split("\n").length;
  const vEventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;

  let parsedCount = 0;
  try {
    const { default: ical } = await import("node-ical");
    const parsed = ical.sync.parseICS(ics);
    parsedCount = Object.values(parsed).filter(
      (i) => (i as { type?: string })?.type === "VEVENT",
    ).length;
  } catch (err) {
    return NextResponse.json({
      step: "parse-failed",
      url: urlPreview,
      bytes: ics.length,
      lines,
      vEventCount,
      error: String(err),
    });
  }

  return NextResponse.json({
    step: "ok",
    url: urlPreview,
    bytes: ics.length,
    lines,
    vEventCountRaw: vEventCount,
    vEventParsed: parsedCount,
    sample: ics.slice(0, 400),
  });
}
