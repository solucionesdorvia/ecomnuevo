export default function FabricasLoading() {
  return (
    <div className="pb-10">
      {/* Hero navy */}
      <div className="fullbleed bg-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
          <div className="h-4 w-28 animate-pulse rounded bg-white/15" />
          <div className="mt-4 h-11 w-full max-w-lg animate-pulse rounded-lg bg-white/15" />
          <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded bg-white/10" />
          <div className="mt-6 flex gap-8">
            <div className="h-12 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-12 w-16 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="size-14 animate-pulse rounded-xl bg-border/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-border/60" />
                <div className="h-3 w-20 animate-pulse rounded bg-border/40" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-20 animate-pulse rounded-full bg-border/40" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-border/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
