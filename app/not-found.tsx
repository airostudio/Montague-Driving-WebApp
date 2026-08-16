import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-muted)] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Page not found</h1>
        <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link href="/dashboard" className="mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
