import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { LinkButton } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-foreground-muted)]">
          <a href="#product" className="hover:text-[var(--color-foreground)]">Product</a>
          <a href="#safety" className="hover:text-[var(--color-foreground)]">Safety</a>
          <a href="#fleet" className="hover:text-[var(--color-foreground)]">Fleet</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]">
            Login
          </Link>
          <LinkButton href="/register" size="sm">Get started</LinkButton>
        </div>
      </div>
    </header>
  );
}
