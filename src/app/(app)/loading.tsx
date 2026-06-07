export default function Loading() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-fg/10" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
          loading
        </span>
      </div>
    </div>
  );
}
