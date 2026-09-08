export default function CheckoutLoading() {
  return (
    <div className="py-6">
      <div className="mb-2 h-9 w-56 animate-pulse rounded-lg bg-border/60" />
      <div className="mb-6 h-4 w-80 max-w-full animate-pulse rounded bg-border/40" />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        {/* Formulario */}
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, s) => (
            <div key={s} className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 h-4 w-40 animate-pulse rounded bg-border/50" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-11 animate-pulse rounded-lg bg-border/40" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-border/50" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 animate-pulse rounded bg-border/40" />
                <div className="h-4 w-12 animate-pulse rounded bg-border/50" />
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex justify-between">
              <div className="h-6 w-20 animate-pulse rounded bg-border/50" />
              <div className="h-6 w-24 animate-pulse rounded bg-border/60" />
            </div>
          </div>
          <div className="mt-4 h-12 animate-pulse rounded-lg bg-border/60" />
        </div>
      </div>
    </div>
  );
}
