export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
