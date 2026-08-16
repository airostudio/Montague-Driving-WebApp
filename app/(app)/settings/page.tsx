import { revalidatePath } from "next/cache";
import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/permissions";

async function updateProfile(formData: FormData) {
  "use server";
  const { profile } = await requireCompanyContext();
  const supabase = await createClient();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!firstName || !lastName) return;

  await supabase
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName, phone: phone || null })
    .eq("id", profile.id);

  revalidatePath("/settings");
}

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile, email } = await requireCompanyContext();

  return (
    <>
      <PageHeader title="Settings" description="Your profile and account preferences." />
      <div className="px-4 py-6 md:px-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" name="firstName" defaultValue={profile.first_name} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" name="lastName" defaultValue={profile.last_name} required />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email ?? ""} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={ROLE_LABELS[profile.role]} disabled />
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Disclaimer</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-foreground-muted)]">
              Montague provides route-planning information using third-party routing and available
              restriction datasets. Road conditions, signage, permits, restrictions and
              infrastructure may change. Drivers and operators remain responsible for complying with
              road signage, permits, regulations and applicable transport authority requirements.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
