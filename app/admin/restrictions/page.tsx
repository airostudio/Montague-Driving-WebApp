import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { AUSTRALIAN_STATES } from "@/types/database";
import { RESTRICTION_TYPES, VERIFICATION_STATUSES } from "@/lib/validation/restriction";
import { formatDateAu, formatMetres, formatTonnes } from "@/lib/utils/units";
import type { RoadRestriction } from "@/types/database";

async function createRestriction(formData: FormData) {
  "use server";
  const { profile } = await requireAuthContext();
  if (profile.role !== "platform_admin") return;
  const supabase = await createClient();

  const numeric = (key: string) => {
    const v = formData.get(key);
    if (!v || v === "") return null;
    return Number(v);
  };

  await supabase.from("road_restrictions").insert({
    country_code: "AU",
    state_code: String(formData.get("stateCode") || "") || null,
    restriction_type: formData.get("restrictionType"),
    name: String(formData.get("name")),
    road_name: String(formData.get("roadName") || "") || null,
    description: String(formData.get("description") || "") || null,
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
    max_height_mm: numeric("maxHeightMm"),
    max_width_mm: numeric("maxWidthMm"),
    max_length_mm: numeric("maxLengthMm"),
    max_weight_kg: numeric("maxWeightKg"),
    max_axles: numeric("maxAxles"),
    permit_required: formData.get("permitRequired") === "on",
    source_name: String(formData.get("sourceName")),
    source_url: String(formData.get("sourceUrl") || "") || null,
    verification_status: formData.get("verificationStatus"),
    verified_at: formData.get("verificationStatus") === "verified" ? new Date().toISOString() : null,
    is_development_data: formData.get("isDevelopmentData") === "on",
  });

  revalidatePath("/admin/restrictions");
}

async function verifyRestriction(formData: FormData) {
  "use server";
  const { profile } = await requireAuthContext();
  if (profile.role !== "platform_admin") return;
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase
    .from("road_restrictions")
    .update({ verification_status: "verified", verified_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/restrictions");
}

export const metadata = { title: "Restriction Management" };

export default async function AdminRestrictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; type?: string; status?: string; q?: string }>;
}) {
  const { state, type, status, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("road_restrictions").select("*").order("created_at", { ascending: false });
  if (state) query = query.eq("state_code", state);
  if (type) query = query.eq("restriction_type", type);
  if (status) query = query.eq("verification_status", status);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: restrictions } = await query.limit(100);
  const list = (restrictions ?? []) as RoadRestriction[];

  return (
    <>
      <PageHeader title="Restriction Management" description="Search, verify and manage road restriction records." />
      <div className="px-4 py-6 md:px-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <form className="flex flex-wrap gap-3" method="get">
            <input type="search" name="q" defaultValue={q} placeholder="Search name" className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm" />
            <select name="state" defaultValue={state ?? ""} className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm">
              <option value="">All states</option>
              {AUSTRALIAN_STATES.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
            </select>
            <select name="type" defaultValue={type ?? ""} className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm">
              <option value="">All types</option>
              {RESTRICTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            <select name="status" defaultValue={status ?? ""} className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-sm">
              <option value="">All statuses</option>
              {VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
            <button type="submit" className="h-9 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white">Filter</button>
          </form>

          {list.length === 0 ? (
            <EmptyState title="No restrictions found" description="Adjust your filters or add a new restriction record." />
          ) : (
            <div className="space-y-3">
              {list.map((restriction) => (
                <Card key={restriction.id}>
                  <CardContent>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-[var(--color-foreground-muted)]">
                          {restriction.restriction_type.replace(/_/g, " ")} · {restriction.state_code ?? "AU"}
                        </p>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">{restriction.name}</p>
                        {restriction.description && (
                          <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">{restriction.description}</p>
                        )}
                      </div>
                      <StatusBadge status={restriction.verification_status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--color-foreground-muted)]">
                      {restriction.max_height_mm != null && <span>Clearance: {formatMetres(restriction.max_height_mm)}</span>}
                      {restriction.max_weight_kg != null && <span>Weight: {formatTonnes(restriction.max_weight_kg)}</span>}
                      <span>Source: {restriction.source_name}</span>
                      {restriction.verified_at && <span>Verified: {formatDateAu(restriction.verified_at)}</span>}
                      {restriction.is_development_data && (
                        <span className="font-semibold text-[var(--color-warning)]">DEVELOPMENT DATA</span>
                      )}
                    </div>
                    {restriction.verification_status !== "verified" && (
                      <form action={verifyRestriction} className="mt-3">
                        <input type="hidden" name="id" value={restriction.id} />
                        <Button type="submit" size="sm" variant="secondary">Mark verified</Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle>Add restriction</CardTitle></CardHeader>
          <CardContent>
            <form action={createRestriction} className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="restrictionType">Type</Label>
                  <Select id="restrictionType" name="restrictionType" required defaultValue="bridge">
                    {RESTRICTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stateCode">State</Label>
                  <Select id="stateCode" name="stateCode" defaultValue="VIC">
                    {AUSTRALIAN_STATES.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="roadName">Road name</Label>
                <Input id="roadName" name="roadName" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" name="latitude" type="number" step="any" required />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" name="longitude" type="number" step="any" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="maxHeightMm">Max height (mm)</Label>
                  <Input id="maxHeightMm" name="maxHeightMm" type="number" />
                </div>
                <div>
                  <Label htmlFor="maxWeightKg">Max weight (kg)</Label>
                  <Input id="maxWeightKg" name="maxWeightKg" type="number" />
                </div>
                <div>
                  <Label htmlFor="maxWidthMm">Max width (mm)</Label>
                  <Input id="maxWidthMm" name="maxWidthMm" type="number" />
                </div>
                <div>
                  <Label htmlFor="maxLengthMm">Max length (mm)</Label>
                  <Input id="maxLengthMm" name="maxLengthMm" type="number" />
                </div>
                <div>
                  <Label htmlFor="maxAxles">Max axles</Label>
                  <Input id="maxAxles" name="maxAxles" type="number" />
                </div>
              </div>
              <div>
                <Label htmlFor="sourceName">Source name</Label>
                <Input id="sourceName" name="sourceName" required />
              </div>
              <div>
                <Label htmlFor="sourceUrl">Source URL</Label>
                <Input id="sourceUrl" name="sourceUrl" type="url" />
              </div>
              <div>
                <Label htmlFor="verificationStatus">Verification status</Label>
                <Select id="verificationStatus" name="verificationStatus" defaultValue="unverified">
                  {VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
                <input type="checkbox" name="permitRequired" /> Permit required
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
                <input type="checkbox" name="isDevelopmentData" /> Development data (not for operational use)
              </label>
              <Button type="submit" className="w-full">Add restriction</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
