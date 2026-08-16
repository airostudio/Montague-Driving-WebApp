"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const MOBILE_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Planner", href: "/planner" },
  { label: "Trucks", href: "/trucks" },
  { label: "Routes", href: "/routes" },
  { label: "More", href: "/settings" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 flex border-t border-[var(--color-border)] bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {MOBILE_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium min-h-[52px]",
              active ? "text-[var(--color-primary)]" : "text-[var(--color-foreground-muted)]"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-[var(--color-primary)]" : "bg-transparent")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
