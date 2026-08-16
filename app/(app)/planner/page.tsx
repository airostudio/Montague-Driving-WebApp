import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { PlannerClient } from "@/components/planner/planner-client";
import type { Truck } from "@/types/database";

export const metadata = { title: "Route Planner" };

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ truckId?: string }>;
}) {
  const { truckId } = await searchParams;
  const { company } = await requireCompanyContext();
  const supabase = await createClient();

  const { data: trucks } = await supabase
    .from("trucks")
    .select("*")
    .eq("company_id", company.id)
    .eq("active", true)
    .order("name");

  const list = (trucks ?? []) as Truck[];

  if (list.length === 0) {
    return (
      <>
        <PageHeader title="Route Planner" />
        <div className="px-4 py-6 md:px-6">
          <EmptyState
            title="No trucks yet"
            description="Add your first vehicle to start planning truck-aware routes."
            action={<LinkButton href="/trucks/new">Add truck</LinkButton>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Route Planner" />
      <PlannerClient trucks={list} defaultTruckId={truckId} />
    </>
  );
}
