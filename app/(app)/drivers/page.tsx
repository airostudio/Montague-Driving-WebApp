import { requireCompanyContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Profile } from "@/types/database";

export const metadata = { title: "Drivers" };

export default async function DriversPage() {
  const { company } = await requireCompanyContext();
  const supabase = await createClient();

  const { data: drivers } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", company.id)
    .in("role", ["driver", "dispatcher"])
    .order("first_name");

  const list = (drivers ?? []) as Profile[];

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Drivers and dispatchers in your company."
        actions={<LinkButton href="/company" variant="secondary">Manage team</LinkButton>}
      />
      <div className="px-4 py-6 md:px-6">
        {list.length === 0 ? (
          <EmptyState title="No drivers yet" description="Invite team members and assign the driver role from Company settings." />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-foreground-muted)]">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((driver) => (
                  <tr key={driver.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--color-foreground)]">{driver.first_name} {driver.last_name}</td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{ROLE_LABELS[driver.role]}</td>
                    <td className="px-4 py-3 text-[var(--color-foreground-muted)]">{driver.active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
