import { NextResponse } from "next/server";
import { getVapid } from "@/lib/vapid";

export async function GET() {
  const { publicKey } = await getVapid();
  return NextResponse.json({ publicKey });
}
