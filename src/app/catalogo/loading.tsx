export default function CatalogoLoading() {
  return (
    <div className="py-6">
      <div className="mb-4 h-8 w-56 animate-pulse rounded-lg bg-border/60" />
      <div className="mb-6 h-24 animate-pulse rounded-xl bg-border/40" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="aspect-[4/5] animate-pulse bg-border/40" />
            <div className="space-y-2 p-3">
              <div className="h-4 animate-pulse rounded bg-border/50" />
              <div className="h-5 w-24 animate-pulse rounded bg-border/60" />
              <div className="h-3 w-32 animate-pulse rounded bg-border/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
