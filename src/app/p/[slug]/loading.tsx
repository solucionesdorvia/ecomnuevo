export default function ProductLoading() {
  return (
    <div className="py-6">
      <div className="mb-4 h-4 w-48 animate-pulse rounded bg-border/50" />
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-[4/5] w-full animate-pulse rounded-xl bg-border/40" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="size-16 animate-pulse rounded-lg bg-border/40" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="space-y-3">
            <div className="h-7 w-4/5 animate-pulse rounded bg-border/50" />
            <div className="h-9 w-40 animate-pulse rounded bg-border/60" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-border/40" />
          </div>
          <div className="h-28 animate-pulse rounded-xl bg-border/30" />
          <div className="flex gap-3">
            <div className="h-12 w-28 animate-pulse rounded-lg bg-border/40" />
            <div className="h-12 flex-1 animate-pulse rounded-lg bg-border/50" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-border/30" />
            <div className="h-4 w-full animate-pulse rounded bg-border/30" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-border/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
