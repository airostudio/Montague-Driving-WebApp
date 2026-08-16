import type { ReactNode } from "react";
import { requireCompanyContext } from "@/lib/auth/session";
import { Logo } from "@/components/ui/logo";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { UserMenu } from "@/components/app-shell/user-menu";
import { MobileBottomNav } from "@/components/app-shell/mobile-nav";
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/components/app-shell/nav-items";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile, company } = await requireCompanyContext();

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-white px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Logo />
        </div>
        <UserMenu
          firstName={profile.first_name}
          lastName={profile.last_name}
          role={profile.role}
          companyName={company.name}
        />
      </header>

      <div className="flex">
        <aside className="hidden md:flex md:w-60 md:flex-col md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] bg-[var(--color-nav)] py-3">
          <SidebarNav items={items} />
          {profile.role === "platform_admin" && (
            <>
              <div className="mx-3 my-2 border-t border-white/10" />
              <SidebarNav items={ADMIN_NAV_ITEMS} heading="Platform Admin" />
            </>
          )}
        </aside>

        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
