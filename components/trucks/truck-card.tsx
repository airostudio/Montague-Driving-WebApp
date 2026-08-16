import Link from "next/link";
import { formatMetres, formatTonnes } from "@/lib/utils/units";
import type { Truck } from "@/types/database";

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  rigid: "Rigid",
  prime_mover: "Prime Mover",
  semi_trailer: "Semi Trailer",
  b_double: "B-Double",
  b_triple: "B-Triple",
  road_train: "Road Train",
  pbs: "PBS",
  other: "Other",
};

export function TruckCard({ truck }: { truck: Truck }) {
  return (
    <Link
      href={`/trucks/${truck.id}`}
      className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 hover:border-[var(--color-primary)] transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">{truck.name}</p>
          {truck.registration && (
            <p className="text-xs text-[var(--color-foreground-muted)]">{truck.registration}</p>
          )}
        </div>
        {!truck.active && (
          <span className="status-badge text-[var(--color-unknown)] bg-[var(--color-unknown-bg)] border-[var(--color-unknown-border)]">
            Archived
          </span>
        )}
      </div>

      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
        {VEHICLE_TYPE_LABELS[truck.vehicle_type] ?? truck.vehicle_type}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Metric value={formatMetres(truck.height_mm)} label="H" />
        <Metric value={formatMetres(truck.width_mm)} label="W" />
        <Metric value={formatMetres(truck.length_mm)} label="L" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        <Metric value={formatTonnes(truck.actual_weight_kg)} label="Weight" />
        <Metric value={`${truck.axle_count}`} label="Axles" />
      </div>
    </Link>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] py-2">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">{value}</p>
      <p className="text-[10px] text-[var(--color-foreground-muted)]">{label}</p>
    </div>
  );
}
