export function PageSkeleton({ title }: { title?: string }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-10 anim-fade-in">
      <div className="mb-6 flex items-baseline gap-3">
        <div className="h-9 w-32 animate-pulse rounded-lg bg-bg-muted sm:h-12" />
        {title && (
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
            {title}
          </span>
        )}
      </div>
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-bg-subtle/60" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-bg-subtle/60" />
          ))}
        </div>
        <div className="h-60 animate-pulse rounded-2xl bg-bg-subtle/60" />
      </div>
    </div>
  );
}
