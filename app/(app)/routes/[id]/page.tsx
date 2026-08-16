import { notFound } from "next/navigation";
import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteMap } from "@/components/map/route-map";
import { MapLegend } from "@/components/map/map-legend";
import { decodePolyline } from "@/lib/routing/polyline";
import { formatDateTimeAu, formatDistance, formatDuration, formatMetres, formatTonnes } from "@/lib/utils/units";
import type { RouteIssue, RouteRecord, RouteStop } from "@/types/database";

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompanyContext();
  const supabase = await createClient();

  const { data: route } = await supabase
    .from("routes")
    .select("*")
    .eq("id", id)
    .eq("company_id", company.id)
    .single<RouteRecord>();

  if (!route) notFound();

  const [{ data: stops }, { data: issues }] = await Promise.all([
    supabase.from("route_stops").select("*").eq("route_id", id).order("sequence"),
    supabase.from("route_issues").select("*").eq("route_id", id),
  ]);

  const path = route.encoded_polyline ? decodePolyline(route.encoded_polyline) : [];
  const snapshot = route.truck_snapshot as Record<string, unknown>;

  return (
    <>
      <PageHeader
        title={`${route.origin_name} → ${route.destination_name}`}
        description={formatDateTimeAu(route.created_at)}
        actions={<StatusBadge status={route.validation_status} />}
      />
      <div className="px-4 py-6 md:px-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <RouteMap
            path={path}
            origin={{ latitude: route.origin_lat, longitude: route.origin_lng }}
            destination={{ latitude: route.destination_lat, longitude: route.destination_lng }}
            stops={((stops ?? []) as RouteStop[]).map((s) => ({ latitude: s.latitude, longitude: s.longitude }))}
            className="h-[420px]"
          />
          <MapLegend />

          <Card>
            <CardHeader><CardTitle>Route summary</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Distance" value={formatDistance(route.distance_metres)} />
              <Stat label="Duration" value={formatDuration(route.duration_seconds)} />
              <Stat label="Tolls" value={route.has_tolls ? "Yes" : "No"} />
              <Stat label="Restrictions checked" value={String(route.checked_restriction_count)} />
            </CardContent>
          </Card>

          {(issues ?? []).length > 0 && (
            <Card>
              <CardHeader><CardTitle>Warnings & restrictions encountered</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(issues as RouteIssue[]).map((issue) => (
                  <div key={issue.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">{issue.title}</p>
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">{issue.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Vehicle snapshot</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium text-[var(--color-foreground)]">{String(snapshot.name ?? "—")}</p>
              <div className="grid grid-cols-2 gap-2 text-[var(--color-foreground-muted)]">
                <p>Height: {formatMetres(Number(snapshot.height_mm))}</p>
                <p>Width: {formatMetres(Number(snapshot.width_mm))}</p>
                <p>Length: {formatMetres(Number(snapshot.length_mm))}</p>
                <p>Weight: {formatTonnes(Number(snapshot.actual_weight_kg))}</p>
                <p>Axles: {String(snapshot.axle_count ?? "—")}</p>
              </div>
              <p className="pt-2 text-xs text-[var(--color-foreground-muted)] border-t border-[var(--color-border)] mt-2">
                This is a snapshot of the vehicle at the time this route was calculated. The truck&apos;s
                current profile may have since changed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Data & disclaimer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs text-[var(--color-foreground-muted)]">
              <p>Calculated: {formatDateTimeAu(route.created_at)}</p>
              <p>
                Montague provides route-planning information using third-party routing and available
                restriction datasets. Road conditions, signage, permits, restrictions and
                infrastructure may change. Drivers and operators remain responsible for complying
                with road signage, permits, regulations and applicable transport authority
                requirements.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-[var(--color-foreground)]">{value}</p>
      <p className="text-xs text-[var(--color-foreground-muted)]">{label}</p>
    </div>
  );
}
