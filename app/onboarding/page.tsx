import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

async function createCompany(formData: FormData) {
  "use server";
  const ctx = await requireAuthContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const abn = String(formData.get("abn") ?? "").trim();
  if (!name) return;

  const { data: company, error } = await supabase
    .from("companies")
    .insert({ name, abn: abn || null })
    .select("id")
    .single();

  if (error || !company) return;

  await supabase
    .from("profiles")
    .update({ company_id: company.id, role: "company_admin" })
    .eq("id", ctx.profile.id);

  await supabase.from("company_members").insert({
    company_id: company.id,
    user_id: ctx.userId,
    role: "company_admin",
  });

  redirect("/dashboard");
}

export default async function OnboardingPage() {
  const ctx = await requireAuthContext();
  if (ctx.profile.company_id) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const suggestedName = (user?.user_metadata?.company_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-muted)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6">
          <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Set up your company</h1>
          <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
            Create your organisation in Montague to start adding trucks and planning routes.
          </p>
          <form action={createCompany} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="name">Company name</Label>
              <Input id="name" name="name" required defaultValue={suggestedName} placeholder="Acme Transport Pty Ltd" />
            </div>
            <div>
              <Label htmlFor="abn">ABN (optional)</Label>
              <Input id="abn" name="abn" placeholder="11 222 333 444" />
            </div>
            <Button type="submit" className="w-full">
              Create company
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
