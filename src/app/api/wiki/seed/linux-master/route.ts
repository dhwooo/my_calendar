import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { seedLinuxMaster } from "@/lib/wiki-seeds";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const result = await seedLinuxMaster(session.user.id);
  return NextResponse.json(result);
}
