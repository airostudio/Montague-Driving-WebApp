import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/session";
import { Logo } from "@/components/ui/logo";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { UserMenu } from "@/components/app-shell/user-menu";
import { ADMIN_NAV_ITEMS, NAV_ITEMS } from "@/components/app-shell/nav-items";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireAuthContext();
  if (profile.role !== "platform_admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-white px-4 md:px-6">
        <Logo />
        <UserMenu firstName={profile.first_name} lastName={profile.last_name} role={profile.role} />
      </header>
      <div className="flex">
        <aside className="hidden md:flex md:w-60 md:flex-col md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] bg-[var(--color-nav)] py-3">
          <SidebarNav items={ADMIN_NAV_ITEMS} heading="Platform Admin" />
          <div className="mx-3 my-2 border-t border-white/10" />
          <SidebarNav items={NAV_ITEMS.slice(0, 1)} heading="Application" />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
