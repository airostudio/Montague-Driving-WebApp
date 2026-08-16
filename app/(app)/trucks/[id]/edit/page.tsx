import { notFound } from "next/navigation";
import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { TruckForm } from "@/components/trucks/truck-form";
import type { Truck } from "@/types/database";

export default async function EditTruckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompanyContext();
  const supabase = await createClient();

  const { data: truck } = await supabase
    .from("trucks")
    .select("*")
    .eq("id", id)
    .eq("company_id", company.id)
    .single<Truck>();

  if (!truck) notFound();

  return (
    <>
      <PageHeader title={`Edit ${truck.name}`} />
      <div className="px-4 py-6 md:px-6 max-w-3xl">
        <TruckForm truck={truck} />
      </div>
    </>
  );
}
