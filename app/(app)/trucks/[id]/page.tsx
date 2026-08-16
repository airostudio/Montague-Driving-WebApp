import { notFound } from "next/navigation";
import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMetres, formatTonnes, formatDateAu } from "@/lib/utils/units";
import { canManageTrucks } from "@/lib/permissions";
import { ArchiveTruckButton } from "@/components/trucks/archive-truck-button";
import type { Truck } from "@/types/database";

export default async function TruckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company, profile } = await requireCompanyContext();
  const supabase = await createClient();

  const { data: truck } = await supabase
    .from("trucks")
    .select("*")
    .eq("id", id)
    .eq("company_id", company.id)
    .single<Truck>();

  if (!truck) notFound();

  const canManage = canManageTrucks(profile.role);

  return (
    <>
      <PageHeader
        title={truck.name}
        description={truck.registration ?? undefined}
        actions={
          canManage ? (
            <>
              <LinkButton href={`/trucks/${truck.id}/edit`} variant="secondary">Edit</LinkButton>
              <ArchiveTruckButton truckId={truck.id} active={truck.active} />
            </>
          ) : undefined
        }
      />
      <div className="px-4 py-6 md:px-6 max-w-3xl space-y-4">
        <Card>
          <CardHeader><CardTitle>Dimensions & weight</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Metric label="Height" value={formatMetres(truck.height_mm)} />
            <Metric label="Width" value={formatMetres(truck.width_mm)} />
            <Metric label="Length" value={formatMetres(truck.length_mm)} />
            <Metric label="Weight" value={formatTonnes(truck.actual_weight_kg)} />
            <Metric label="Axles" value={String(truck.axle_count)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--color-foreground-muted)]">
            <p>Trailers: {truck.trailer_count}</p>
            <p>
              Dangerous goods:{" "}
              {truck.hazardous_goods_types.length > 0 ? truck.hazardous_goods_types.join(", ") : "None declared"}
            </p>
            <p>
              Custom clearance margin:{" "}
              {truck.custom_height_safety_margin_mm != null ? `${truck.custom_height_safety_margin_mm} mm` : "Uses company default"}
            </p>
            {truck.notes && <p>Notes: {truck.notes}</p>}
            <p>Added: {formatDateAu(truck.created_at)}</p>
          </CardContent>
        </Card>

        <LinkButton href={`/planner?truckId=${truck.id}`}>Plan a route with this truck</LinkButton>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-[var(--color-foreground)]">{value}</p>
      <p className="text-xs text-[var(--color-foreground-muted)]">{label}</p>
    </div>
  );
}
