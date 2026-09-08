export default function MisPedidosLoading() {
  return (
    <div className="pb-10">
      {/* Header de cuenta */}
      <div className="fullbleed bg-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
          <div className="h-9 w-52 animate-pulse rounded-lg bg-white/15" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-white/10" />
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 h-4 w-28 animate-pulse rounded bg-border/60" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[10px] border border-primary/10 bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-border/60" />
                <div className="h-3 w-20 animate-pulse rounded bg-border/50" />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="h-4 w-40 animate-pulse rounded bg-border/40" />
                <div className="h-5 w-16 animate-pulse rounded bg-border/60" />
              </div>
              <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-border/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
