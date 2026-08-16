"use client";

import { useState, type FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      setError("Incorrect email or password. Please try again.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6">
        <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
          Access your Montague route planning account.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="mb-0">Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-[var(--color-primary)]">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-[var(--color-critical)]">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-foreground-muted)]">
          New to Montague?{" "}
          <Link href="/register" className="font-medium text-[var(--color-primary)]">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-muted)] px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
