import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
              Safer routes for heavy vehicles. Built for the Australian transport industry.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-foreground-muted)]">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-foreground-muted)]">
                <li><a href="#product" className="hover:text-[var(--color-foreground)]">Route planning</a></li>
                <li><a href="#safety" className="hover:text-[var(--color-foreground)]">Safety data</a></li>
                <li><a href="#fleet" className="hover:text-[var(--color-foreground)]">Fleet profiles</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-foreground-muted)]">Account</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-foreground-muted)]">
                <li><a href="/login" className="hover:text-[var(--color-foreground)]">Login</a></li>
                <li><a href="/register" className="hover:text-[var(--color-foreground)]">Start planning</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--color-border)] pt-6">
          <p className="text-xs leading-relaxed text-[var(--color-foreground-muted)] max-w-3xl">
            Montague provides route-planning information using third-party routing and available
            restriction datasets. Road conditions, signage, permits, restrictions and infrastructure
            may change. Drivers and operators remain responsible for complying with road signage,
            permits, regulations and applicable transport authority requirements.
          </p>
          <p className="mt-4 text-xs text-[var(--color-foreground-muted)]">
            © {new Date().getFullYear()} Montague. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
