const LEGEND_ITEMS = [
  { label: "Route", color: "#2454a8" },
  { label: "Clearance restriction", color: "#b3261e" },
  { label: "Mass restriction", color: "#9a6300" },
  { label: "Access restriction", color: "#9a6300" },
  { label: "Closure", color: "#b3261e" },
  { label: "Unverified data", color: "#46505c" },
];

export function MapLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Map legend">
      {LEGEND_ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-[var(--color-foreground-muted)]">
          <span
            className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
