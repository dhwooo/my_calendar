import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/server-auth";
import { MarketTicker } from "@/components/MarketTicker";
import { AssetsClient, type Entry } from "./AssetsClient";

export default async function AssetsPage() {
  const userId = await requireUserId();
  const rows = await prisma.assetEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  const initialEntries: Entry[] = rows.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    label: r.label,
    amount: r.amount,
    category: r.category,
  }));

  return (
    <div className="anim-fade-in">
      <div className="mx-auto max-w-4xl px-5 pt-6 sm:px-8 sm:pt-10">
        <div className="mb-5 flex items-baseline gap-3">
          <h1 className="text-gradient text-[32px] font-semibold tracking-tight sm:text-[40px]">
            자산
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
            assets
          </span>
        </div>
      </div>

      <MarketTicker />

      <AssetsClient initialEntries={initialEntries} />
    </div>
  );
}
