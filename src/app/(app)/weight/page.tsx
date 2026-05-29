import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/server-auth";
import { WeightClient } from "./WeightClient";

export default async function WeightPage() {
  const userId = await requireUserId();
  const rows = await prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
  const initialEntries = rows.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    kg: r.kg,
  }));

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-10 anim-fade-in">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-gradient text-[32px] font-semibold tracking-tight sm:text-[40px]">
          체중
        </h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          weight
        </span>
      </div>
      <WeightClient initialEntries={initialEntries} />
    </div>
  );
}
