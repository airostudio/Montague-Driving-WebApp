import { cn } from "@/lib/utils/cn";
import type { RouteValidationStatus, VerificationStatus } from "@/types/database";

const statusStyles: Record<string, string> = {
  clear: "text-[var(--color-success)] bg-[var(--color-success-bg)] border-[var(--color-success-border)]",
  warning: "text-[var(--color-warning)] bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]",
  restricted: "text-[var(--color-critical)] bg-[var(--color-critical-bg)] border-[var(--color-critical-border)]",
  unknown: "text-[var(--color-unknown)] bg-[var(--color-unknown-bg)] border-[var(--color-unknown-border)]",
  verified: "text-[var(--color-success)] bg-[var(--color-success-bg)] border-[var(--color-success-border)]",
  unverified: "text-[var(--color-unknown)] bg-[var(--color-unknown-bg)] border-[var(--color-unknown-border)]",
  expired: "text-[var(--color-warning)] bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]",
  needs_review: "text-[var(--color-warning)] bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]",
};

const statusLabels: Record<string, string> = {
  clear: "Checked — No known conflicts",
  warning: "Warning — Requires attention",
  restricted: "Restricted",
  unknown: "Unknown — Requires verification",
  verified: "Verified",
  unverified: "Unverified",
  expired: "Expired",
  needs_review: "Needs review",
};

export function StatusBadge({
  status,
  compact = false,
}: {
  status: RouteValidationStatus | VerificationStatus | string;
  compact?: boolean;
}) {
  return (
    <span className={cn("status-badge", statusStyles[status] ?? statusStyles.unknown)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {compact ? status.replace(/_/g, " ") : statusLabels[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: "info" | "warning" | "critical" }) {
  const map = {
    info: statusStyles.unknown,
    warning: statusStyles.warning,
    critical: statusStyles.restricted,
  };
  const labels = { info: "Info", warning: "Warning", critical: "Critical" };
  return (
    <span className={cn("status-badge", map[severity])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {labels[severity]}
    </span>
  );
}
