import { formatMetres, formatTonnes } from "@/lib/utils/units";
import type { Truck } from "@/types/database";

export function SelectedVehicleSummary({ truck }: { truck: Truck }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
      <p className="text-xs font-medium text-[var(--color-foreground-muted)]">Selected vehicle</p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--color-foreground)]">{truck.name}</p>
      <div className="mt-2 grid grid-cols-5 gap-1.5 text-center">
        <VStat value={formatMetres(truck.height_mm)} label="H" />
        <VStat value={formatMetres(truck.width_mm)} label="W" />
        <VStat value={formatMetres(truck.length_mm)} label="L" />
        <VStat value={formatTonnes(truck.actual_weight_kg)} label="" />
        <VStat value={String(truck.axle_count)} label="Axles" />
      </div>
    </div>
  );
}

function VStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-white py-1.5">
      <p className="text-xs font-semibold text-[var(--color-foreground)]">{value}</p>
      {label && <p className="text-[9px] text-[var(--color-foreground-muted)]">{label}</p>}
    </div>
  );
}
