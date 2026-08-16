"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS } from "@/lib/permissions";
import type { UserRole } from "@/types/database";

export function UserMenu({
  firstName,
  lastName,
  role,
  companyName,
}: {
  firstName: string;
  lastName: string;
  role: UserRole;
  companyName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full pr-3 pl-1 py-1 hover:bg-[var(--color-surface-inset)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-medium text-[var(--color-foreground)]">
            {firstName} {lastName}
          </span>
          <span className="text-xs text-[var(--color-foreground-muted)]">{ROLE_LABELS[role]}</span>
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white py-1 shadow-lg z-50"
        >
          {companyName && (
            <div className="px-3 py-2 text-xs text-[var(--color-foreground-muted)] border-b border-[var(--color-border)]">
              {companyName}
            </div>
          )}
          <a href="/settings" className="block px-3 py-2 text-sm hover:bg-[var(--color-surface-inset)]">
            Settings
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full text-left px-3 py-2 text-sm text-[var(--color-critical)] hover:bg-[var(--color-critical-bg)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
