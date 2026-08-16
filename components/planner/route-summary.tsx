import { StatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistance, formatDuration, formatMetres } from "@/lib/utils/units";
import type { RouteCalculationResult } from "@/types/route-calculation";

const STATUS_COPY: Record<string, { heading: string; supporting: string }> = {
  clear: {
    heading: "No known conflicts found",
    supporting: "Route checked against available Montague restriction data.",
  },
  warning: {
    heading: "Route requires attention",
    supporting: "Review the flagged items below before departure.",
  },
  restricted: {
    heading: "Known restriction conflicts with this vehicle",
    supporting: "This route includes at least one confirmed restriction for the selected vehicle.",
  },
  unknown: {
    heading: "Insufficient data for part of this route",
    supporting: "Some sections could not be verified against known restriction data.",
  },
};

export function RouteSummary({
  result,
  onSave,
  saving,
  saved,
}: {
  result: RouteCalculationResult;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const copy = STATUS_COPY[result.validation.overallStatus];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <StatusBadge status={result.validation.overallStatus} />
          <p className="mt-1.5 text-sm font-semibold text-[var(--color-foreground)]">{copy.heading}</p>
          <p className="text-xs text-[var(--color-foreground-muted)]">{copy.supporting}</p>
        </div>
        <Button onClick={onSave} loading={saving} disabled={saved}>
          {saved ? "Route saved" : saving ? "Saving…" : "Save route"}
        </Button>
      </div>

      {result.rejected && (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-critical-border)] bg-[var(--color-critical-bg)] p-3 text-sm text-[var(--color-critical)]">
          {result.hasViableAlternative
            ? "This candidate has a known conflict. An alternative route may be available — try adjusting your options."
            : "No suitable route could be found using available data for this vehicle configuration."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Distance" value={formatDistance(result.route.distanceMetres)} />
        <SummaryStat label="Est. driving time" value={formatDuration(result.route.durationSeconds)} />
        <SummaryStat label="Tolls" value={result.route.hasTolls ? "Tolls on route" : "No tolls"} />
        <SummaryStat label="Restrictions checked" value={String(result.validation.checkedRestrictionCount)} />
      </div>

      {result.validation.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-foreground-muted)]">
            Warnings & restrictions
          </p>
          {result.validation.issues.map((issue, index) => (
            <div key={index} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--color-foreground)]">{issue.title}</p>
                <SeverityBadge severity={issue.severity} />
              </div>
              <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">{issue.description}</p>
              {issue.truckValue != null && issue.restrictionValue != null && issue.unit === "mm" && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <span>Truck: <strong>{formatMetres(issue.truckValue)}</strong></span>
                  <span>Permitted: <strong>{formatMetres(issue.restrictionValue)}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--color-foreground-muted)] border-t border-[var(--color-border)] pt-3">
        Montague provides route-planning information using third-party routing and available
        restriction datasets. Additional verification may be required — drivers and operators
        remain responsible for complying with road signage, permits and regulations.
      </p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">{value}</p>
      <p className="text-xs text-[var(--color-foreground-muted)]">{label}</p>
    </div>
  );
}
