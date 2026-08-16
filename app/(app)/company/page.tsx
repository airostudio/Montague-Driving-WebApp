import { revalidatePath } from "next/cache";
import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ROLE_LABELS, canManageCompany } from "@/lib/permissions";
import type { Profile, UserRole } from "@/types/database";

const ROLES: UserRole[] = ["driver", "dispatcher", "fleet_manager", "company_admin"];

async function updateCompanySettings(formData: FormData) {
  "use server";
  const { company, profile } = await requireCompanyContext();
  if (!canManageCompany(profile.role)) return;
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const abn = String(formData.get("abn") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const marginMm = Number(formData.get("heightSafetyMarginMm"));

  if (!name) return;

  await supabase
    .from("companies")
    .update({
      name,
      abn: abn || null,
      timezone: timezone || "Australia/Melbourne",
      height_safety_margin_mm: Number.isFinite(marginMm) ? marginMm : company.height_safety_margin_mm,
    })
    .eq("id", company.id);

  revalidatePath("/company");
}

async function updateMemberRole(formData: FormData) {
  "use server";
  const { company, profile: actingProfile } = await requireCompanyContext();
  if (!canManageCompany(actingProfile.role)) return;
  const supabase = await createClient();

  const profileId = String(formData.get("profileId"));
  const role = formData.get("role") as UserRole;

  await supabase.from("profiles").update({ role }).eq("id", profileId).eq("company_id", company.id);
  revalidatePath("/company");
}

export const metadata = { title: "Company" };

export default async function CompanyPage() {
  const { company, profile } = await requireCompanyContext();
  const supabase = await createClient();
  const canManage = canManageCompany(profile.role);

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at");

  return (
    <>
      <PageHeader title="Company" description="Manage your organisation's settings and team." />
      <div className="px-4 py-6 md:px-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader><CardTitle>Team members</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-foreground-muted)]">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {((members ?? []) as Profile[]).map((member) => (
                  <tr key={member.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--color-foreground)]">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <form action={updateMemberRole} className="flex items-center gap-2">
                          <input type="hidden" name="profileId" value={member.id} />
                          <Select name="role" defaultValue={member.role} className="h-8 w-44">
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </Select>
                          <Button type="submit" size="sm" variant="secondary">Save</Button>
                        </form>
                      ) : (
                        ROLE_LABELS[member.role]
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>Company settings</CardTitle></CardHeader>
          <CardContent>
            <form action={updateCompanySettings} className="space-y-3">
              <div>
                <Label htmlFor="name">Company name</Label>
                <Input id="name" name="name" defaultValue={company.name} disabled={!canManage} required />
              </div>
              <div>
                <Label htmlFor="abn">ABN</Label>
                <Input id="abn" name="abn" defaultValue={company.abn ?? ""} disabled={!canManage} />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" name="timezone" defaultValue={company.timezone} disabled={!canManage} />
              </div>
              <div>
                <Label htmlFor="heightSafetyMarginMm">Height safety margin (mm)</Label>
                <Input
                  id="heightSafetyMarginMm"
                  name="heightSafetyMarginMm"
                  type="number"
                  defaultValue={company.height_safety_margin_mm}
                  disabled={!canManage}
                />
                <p className="mt-1 text-xs text-[var(--color-foreground-muted)]">
                  Extra clearance required above a restriction&apos;s stated height limit before a
                  route is flagged. Individual trucks can override this default.
                </p>
              </div>
              {canManage && <Button type="submit" className="w-full">Save settings</Button>}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
