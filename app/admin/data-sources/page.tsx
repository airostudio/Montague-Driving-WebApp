import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatDateTimeAu } from "@/lib/utils/units";
import type { DataSource } from "@/types/database";

async function createDataSource(formData: FormData) {
  "use server";
  const { profile } = await requireAuthContext();
  if (profile.role !== "platform_admin") return;
  const supabase = await createClient();

  await supabase.from("data_sources").insert({
    name: String(formData.get("name")),
    jurisdiction: String(formData.get("jurisdiction")),
    source_type: String(formData.get("sourceType")),
    source_url: String(formData.get("sourceUrl") || "") || null,
    licence: String(formData.get("licence") || "") || null,
    update_frequency: String(formData.get("updateFrequency") || "") || null,
  });

  revalidatePath("/admin/data-sources");
}

// Placeholder for future scheduled ingestion. Real scraping/import is not
// implemented in the MVP — this records a manual/no-op run so the
// data_import_jobs history and last_import_at tracking work end-to-end.
async function runImport(formData: FormData) {
  "use server";
  const { profile } = await requireAuthContext();
  if (profile.role !== "platform_admin") return;
  const supabase = await createClient();
  const dataSourceId = String(formData.get("dataSourceId"));
  const now = new Date().toISOString();

  await supabase.from("data_import_jobs").insert({
    data_source_id: dataSourceId,
    started_at: now,
    completed_at: now,
    status: "succeeded",
    records_received: 0,
    records_created: 0,
    records_updated: 0,
    records_failed: 0,
    error_message: "No automated import configured for this source yet.",
  });

  await supabase
    .from("data_sources")
    .update({ last_import_at: now, last_success_at: now })
    .eq("id", dataSourceId);

  revalidatePath("/admin/data-sources");
}

export const metadata = { title: "Data Sources" };

export default async function AdminDataSourcesPage() {
  const supabase = await createClient();
  const { data: sources } = await supabase.from("data_sources").select("*").order("name");
  const list = (sources ?? []) as DataSource[];

  return (
    <>
      <PageHeader title="Data Sources" description="Configured restriction data providers and import history." />
      <div className="px-4 py-6 md:px-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {list.length === 0 ? (
            <EmptyState title="No data sources configured" description="Add a source to begin tracking restriction data provenance." />
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-foreground-muted)]">
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Jurisdiction</th>
                    <th className="px-4 py-3 font-medium">Last import</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((source) => (
                    <tr key={source.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-4 py-3 text-[var(--color-foreground)]">{source.name}</td>
                      <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{source.jurisdiction}</td>
                      <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{formatDateTimeAu(source.last_import_at)}</td>
                      <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{source.active ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-3">
                        <form action={runImport}>
                          <input type="hidden" name="dataSourceId" value={source.id} />
                          <Button type="submit" size="sm" variant="secondary">Run import</Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle>Add data source</CardTitle></CardHeader>
          <CardContent>
            <form action={createDataSource} className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="NHVR Restricted Access Vehicle Maps" />
              </div>
              <div>
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Input id="jurisdiction" name="jurisdiction" required placeholder="National / VIC / NSW…" />
              </div>
              <div>
                <Label htmlFor="sourceType">Source type</Label>
                <Input id="sourceType" name="sourceType" required placeholder="government_dataset" />
              </div>
              <div>
                <Label htmlFor="sourceUrl">Source URL</Label>
                <Input id="sourceUrl" name="sourceUrl" type="url" />
              </div>
              <div>
                <Label htmlFor="licence">Licence</Label>
                <Input id="licence" name="licence" />
              </div>
              <div>
                <Label htmlFor="updateFrequency">Update frequency</Label>
                <Input id="updateFrequency" name="updateFrequency" placeholder="weekly" />
              </div>
              <Button type="submit" className="w-full">Add source</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
