import { StatusBadge } from "@/components/ui/badge";
import { formatDateAu } from "@/lib/utils/units";
import type { RoadRestriction } from "@/types/database";

const TYPE_LABELS: Record<string, string> = {
  height: "Height restriction",
  width: "Width restriction",
  length: "Length restriction",
  weight: "Weight restriction",
  axle: "Axle restriction",
  bridge: "Low clearance bridge",
  tunnel: "Low clearance tunnel",
  road_access: "Road access restriction",
  vehicle_class: "Vehicle class restriction",
  hazardous_goods: "Hazardous goods restriction",
  curfew: "Curfew",
  closure: "Closure",
  permit_required: "Permit required",
  road_condition: "Road condition",
  other: "Restriction",
};

function statusFor(restriction: RoadRestriction) {
  if (restriction.verification_status === "verified") return "verified";
  return restriction.verification_status;
}

export function RestrictionDetailCard({
  restriction,
  onClose,
}: {
  restriction: RoadRestriction;
  onClose?: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-critical)]">
          {TYPE_LABELS[restriction.restriction_type] ?? restriction.restriction_type}
        </p>
        {onClose && (
          <button type="button" onClick={onClose} className="text-xs text-[var(--color-foreground-muted)]" aria-label="Close">
            Close
          </button>
        )}
      </div>
      <h3 className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">{restriction.name}</h3>
      {restriction.description && (
        <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">{restriction.description}</p>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {restriction.max_height_mm != null && (
          <Field label="Clearance" value={`${(restriction.max_height_mm / 1000).toFixed(2)} m`} />
        )}
        {restriction.max_weight_kg != null && (
          <Field label="Weight limit" value={`${(restriction.max_weight_kg / 1000).toFixed(1)} t`} />
        )}
        {restriction.max_width_mm != null && (
          <Field label="Width limit" value={`${(restriction.max_width_mm / 1000).toFixed(2)} m`} />
        )}
        {restriction.max_length_mm != null && (
          <Field label="Length limit" value={`${(restriction.max_length_mm / 1000).toFixed(2)} m`} />
        )}
      </dl>

      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={statusFor(restriction)} />
        {restriction.is_development_data && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-warning)]">
            Development data
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-foreground-muted)] space-y-1">
        <p>Source: {restriction.source_name}</p>
        {restriction.verified_at && <p>Verified: {formatDateAu(restriction.verified_at)}</p>}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--color-foreground-muted)]">{label}</dt>
      <dd className="font-semibold text-[var(--color-foreground)]">{value}</dd>
    </div>
  );
}
