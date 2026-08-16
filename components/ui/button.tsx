import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50",
  secondary:
    "bg-white text-[var(--color-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-surface-inset)] disabled:opacity-50",
  danger:
    "bg-white text-[var(--color-critical)] border border-[var(--color-critical-border)] hover:bg-[var(--color-critical-bg)] disabled:opacity-50",
  ghost: "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-inset)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-[var(--radius-sm)]",
  md: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
  lg: "h-12 px-6 text-base rounded-[var(--radius-md)]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
