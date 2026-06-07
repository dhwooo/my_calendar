import { WeightClient } from "./WeightClient";

// SSR DB 쿼리 제거 — 클라이언트 SWR이 /api/weight로 직접 fetch.
export default function WeightPage() {
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
      <WeightClient initialEntries={[]} />
    </div>
  );
}
