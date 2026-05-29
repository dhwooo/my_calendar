import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { seedDemoEvents } from "@/lib/demo";

const DEMO_USERNAME = "demo";
const DEMO_PIN = "0000";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const passwordHash = await bcrypt.hash(DEMO_PIN, 10);
  const user = await prisma.user.upsert({
    where: { username: DEMO_USERNAME },
    update: { passwordHash },
    create: {
      name: "데모",
      username: DEMO_USERNAME,
      passwordHash,
    },
  });

  await seedDemoEvents(user.id);

  return NextResponse.json({
    username: DEMO_USERNAME,
    pin: DEMO_PIN,
  });
}
