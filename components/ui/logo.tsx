import { cn } from "@/lib/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-7 w-7", className)}
      aria-hidden
      fill="none"
    >
      <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
      <path d="M8 23V9l8 8 8-8v14" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className={dark ? "text-white" : "text-[var(--color-foreground)]"}>Montague</span>
    </span>
  );
}
