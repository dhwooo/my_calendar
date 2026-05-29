import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { pullFromGoogle } from "@/lib/sync";

const schema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  try {
    const pulled = await pullFromGoogle(
      session.user.id,
      new Date(parsed.data.from),
      new Date(parsed.data.to),
    );
    return NextResponse.json({ pulled });
  } catch (err) {
    console.error("sync error:", err);
    return NextResponse.json({ pulled: 0, error: String(err) }, { status: 500 });
  }
}
