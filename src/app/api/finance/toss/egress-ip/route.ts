import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 우리 서버(Vercel function) → 토스로 나가는 outbound IP 확인용.
// 여러 ip-확인 서비스를 차례로 호출해 보고, 받은 IP들을 모두 반환.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const probes = [
    "https://api.ipify.org?format=json",
    "https://ifconfig.me/all.json",
    "https://ipinfo.io/json",
  ];

  const results = await Promise.all(
    probes.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const text = await res.text();
        let parsed: unknown = text;
        try {
          parsed = JSON.parse(text);
        } catch {
          /* keep raw */
        }
        return { url, status: res.status, body: parsed };
      } catch (err) {
        return { url, error: (err as Error).message };
      }
    }),
  );

  // 쉽게 찾을 수 있도록 IP만 추출
  const ips = Array.from(
    new Set(
      results
        .map((r) => {
          const b = (r as { body?: unknown }).body;
          if (!b || typeof b !== "object") return null;
          const o = b as Record<string, unknown>;
          return (
            (typeof o.ip === "string" && o.ip) ||
            (typeof o.ip_addr === "string" && o.ip_addr) ||
            null
          );
        })
        .filter((v): v is string => !!v),
    ),
  );

  return NextResponse.json({ ips, raw: results });
}
