"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "./nav-items";

export function SidebarNav({ items, heading }: { items: NavItem[]; heading?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={heading ?? "Primary"} className="flex flex-col gap-0.5">
      {heading && (
        <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-nav-muted)]">
          {heading}
        </p>
      )}
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "mx-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-[var(--color-nav-muted)] hover:bg-white/5 hover:text-[var(--color-nav-foreground)]"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
