import { revalidatePath } from "next/cache";
import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { SavedLocation } from "@/types/database";

async function createLocation(formData: FormData) {
  "use server";
  const { company, profile } = await requireCompanyContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !address || Number.isNaN(latitude) || Number.isNaN(longitude)) return;

  await supabase.from("saved_locations").insert({
    company_id: company.id,
    name,
    formatted_address: address,
    latitude,
    longitude,
    notes: notes || null,
    created_by: profile.id,
  });

  revalidatePath("/locations");
}

async function deleteLocation(formData: FormData) {
  "use server";
  const { company } = await requireCompanyContext();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("saved_locations").delete().eq("id", id).eq("company_id", company.id);
  revalidatePath("/locations");
}

export const metadata = { title: "Locations" };

export default async function LocationsPage() {
  const { company } = await requireCompanyContext();
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("saved_locations")
    .select("*")
    .eq("company_id", company.id)
    .order("name");

  const list = (locations ?? []) as SavedLocation[];

  return (
    <>
      <PageHeader title="Locations" description="Frequently used addresses for quick selection in the Route Planner." />
      <div className="px-4 py-6 md:px-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {list.length === 0 ? (
            <EmptyState title="No saved locations yet" description="Add depots, warehouses or ports for quick selection when planning routes." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((location) => (
                <Card key={location.id}>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">{location.name}</p>
                    <p className="text-sm text-[var(--color-foreground-muted)]">{location.formatted_address}</p>
                    {location.notes && <p className="text-xs text-[var(--color-foreground-muted)]">{location.notes}</p>}
                    <form action={deleteLocation}>
                      <input type="hidden" name="id" value={location.id} />
                      <Button type="submit" variant="danger" size="sm">Delete</Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit">
          <CardContent>
            <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Add location</h2>
            <form action={createLocation} className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="Main Depot" />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" required placeholder="100 Footscray Road, Melbourne VIC" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" name="latitude" type="number" step="any" required placeholder="-37.8103" />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" name="longitude" type="number" step="any" required placeholder="144.9327" />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input id="notes" name="notes" placeholder="Primary distribution depot" />
              </div>
              <Button type="submit" className="w-full">Save location</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
