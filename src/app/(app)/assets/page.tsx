import { MarketTicker } from "@/components/MarketTicker";
import { AssetsClient } from "./AssetsClient";

// SSR DB 쿼리 제거 — 클라이언트 SWR이 /api/assets로 직접 fetch.
export default function AssetsPage() {
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

      <AssetsClient initialEntries={[]} />
    </div>
  );
}
