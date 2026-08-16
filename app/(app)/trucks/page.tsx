import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { TruckCard } from "@/components/trucks/truck-card";
import type { Truck } from "@/types/database";

export const metadata = { title: "Trucks" };

export default async function TrucksPage() {
  const { company } = await requireCompanyContext();
  const supabase = await createClient();

  const { data: trucks } = await supabase
    .from("trucks")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  const list = (trucks ?? []) as Truck[];

  return (
    <>
      <PageHeader
        title="Trucks"
        description="Vehicle profiles used for truck-aware route planning."
        actions={<LinkButton href="/trucks/new">Add truck</LinkButton>}
      />
      <div className="px-4 py-6 md:px-6">
        {list.length === 0 ? (
          <EmptyState
            title="No trucks yet"
            description="Add your first vehicle to start planning truck-aware routes."
            action={<LinkButton href="/trucks/new">Add truck</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((truck) => (
              <TruckCard key={truck.id} truck={truck} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
