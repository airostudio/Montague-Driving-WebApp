import Link from "next/link";
import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTimeAu, formatDistance, formatDuration } from "@/lib/utils/units";
import type { RouteRecord } from "@/types/database";

export const metadata = { title: "Route History" };

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; truckId?: string; q?: string }>;
}) {
  const { status, truckId, q } = await searchParams;
  const { company } = await requireCompanyContext();
  const supabase = await createClient();

  let query = supabase
    .from("routes")
    .select("*, trucks(name, registration)")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("validation_status", status);
  if (truckId) query = query.eq("truck_id", truckId);
  if (q) query = query.or(`origin_name.ilike.%${q}%,destination_name.ilike.%${q}%`);

  const { data: routes } = await query;
  const list = (routes ?? []) as (RouteRecord & { trucks: { name: string; registration: string | null } | null })[];

  const { data: trucks } = await supabase.from("trucks").select("id, name").eq("company_id", company.id);

  return (
    <>
      <PageHeader title="Route History" description="Previously calculated and saved routes." />
      <div className="px-4 py-6 md:px-6 space-y-4">
        <form className="flex flex-wrap gap-3" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search address or route name"
            className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          />
          <select name="truckId" defaultValue={truckId ?? ""} className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm">
            <option value="">All trucks</option>
            {(trucks ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select name="status" defaultValue={status ?? ""} className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm">
            <option value="">All statuses</option>
            <option value="clear">Checked</option>
            <option value="warning">Warning</option>
            <option value="restricted">Restricted</option>
            <option value="unknown">Unknown</option>
          </select>
          <button type="submit" className="h-9 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white">
            Filter
          </button>
        </form>

        {list.length === 0 ? (
          <EmptyState title="No saved routes yet." description="Plan and save your first route." action={<LinkButton href="/planner">Plan a route</LinkButton>} />
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-foreground-muted)]">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Origin</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Truck</th>
                  <th className="px-4 py-3 font-medium">Distance</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((route) => (
                  <tr key={route.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                    <td className="px-4 py-3">
                      <Link href={`/routes/${route.id}`} className="text-[var(--color-primary)] font-medium">
                        {formatDateTimeAu(route.created_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{route.origin_name}</td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{route.destination_name}</td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{route.trucks?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{formatDistance(route.distance_metres)}</td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{formatDuration(route.duration_seconds)}</td>
                    <td className="px-4 py-3"><StatusBadge status={route.validation_status} compact /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
