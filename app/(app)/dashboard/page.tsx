import Link from "next/link";
import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBadge } from "@/components/ui/badge";
import { TruckCard } from "@/components/trucks/truck-card";
import { formatDateAu, formatDistance, formatDuration } from "@/lib/utils/units";
import type { RouteRecord, Truck } from "@/types/database";

export const metadata = { title: "Dashboard" };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { company, profile } = await requireCompanyContext();
  const supabase = await createClient();

  // eslint-disable-next-line react-hooks/purity -- server component, computed once per request
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: trucks }, { count: routesThisWeek }, { data: recentRoutes }, { count: savedLocationCount }] =
    await Promise.all([
      supabase.from("trucks").select("*").eq("company_id", company.id).eq("active", true),
      supabase
        .from("routes")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)
        .gte("created_at", weekAgo),
      supabase
        .from("routes")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("saved_locations").select("id", { count: "exact", head: true }).eq("company_id", company.id),
    ]);

  const truckList = (trucks ?? []) as Truck[];
  const routes = (recentRoutes ?? []) as RouteRecord[];
  const restrictionsEncountered = routes.filter((r) => r.validation_status !== "clear").length;

  return (
    <div className="px-4 py-6 md:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-foreground)]">
            {greeting()}, {profile.first_name || "there"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">{company.name}</p>
        </div>
        <LinkButton href="/planner" size="lg">Plan a route</LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Active trucks" value={String(truckList.length)} />
        <KpiCard label="Routes this week" value={String(routesThisWeek ?? 0)} />
        <KpiCard label="Restrictions encountered" value={String(restrictionsEncountered)} hint="Last 5 routes" />
        <KpiCard label="Saved locations" value={String(savedLocationCount ?? 0)} />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent routes</CardTitle>
          <Link href="/routes" className="text-xs font-medium text-[var(--color-primary)]">View all</Link>
        </CardHeader>
        <CardContent className="p-0">
          {routes.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No saved routes yet." description="Plan and save your first route." action={<LinkButton href="/planner">Plan a route</LinkButton>} />
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {routes.map((route) => (
                <Link
                  key={route.id}
                  href={`/routes/${route.id}`}
                  className="flex flex-col gap-2 p-4 hover:bg-[var(--color-surface-muted)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {route.origin_name} → {route.destination_name}
                    </p>
                    <p className="text-xs text-[var(--color-foreground-muted)]">{formatDateAu(route.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-foreground-muted)]">
                    <span>{formatDistance(route.distance_metres)}</span>
                    <span>{formatDuration(route.duration_seconds)}</span>
                    <StatusBadge status={route.validation_status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Fleet status</h2>
          <Link href="/trucks" className="text-xs font-medium text-[var(--color-primary)]">Manage trucks</Link>
        </div>
        {truckList.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No trucks yet" description="Add your first vehicle to start planning truck-aware routes." action={<LinkButton href="/trucks/new">Add truck</LinkButton>} />
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {truckList.slice(0, 6).map((truck) => (
              <TruckCard key={truck.id} truck={truck} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
