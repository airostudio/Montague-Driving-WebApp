"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-muted)] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
          We hit an unexpected error. Please try again — if the problem persists, contact your
          administrator.
        </p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
