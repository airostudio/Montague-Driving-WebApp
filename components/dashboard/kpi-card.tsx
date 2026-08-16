export function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs font-medium text-[var(--color-foreground-muted)]">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-[var(--color-foreground)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-foreground-muted)]">{hint}</p>}
    </div>
  );
}
