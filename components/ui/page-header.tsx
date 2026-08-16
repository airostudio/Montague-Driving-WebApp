import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] bg-white px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-foreground)]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-white px-6 py-16 text-center">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--color-foreground-muted)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
