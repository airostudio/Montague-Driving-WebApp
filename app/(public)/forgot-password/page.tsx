"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });
    setLoading(false);
    if (resetError) {
      setError("Could not send reset email. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-muted)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6">
          {sent ? (
            <>
              <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Check your email</h1>
              <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
                If an account exists for {email}, a password reset link has been sent.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Reset your password</h1>
              <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {error && <p className="text-sm text-[var(--color-critical)]">{error}</p>}
                <Button type="submit" className="w-full" loading={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            </>
          )}
          <p className="mt-5 text-center text-sm text-[var(--color-foreground-muted)]">
            <Link href="/login" className="font-medium text-[var(--color-primary)]">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
