"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError("You must accept the terms to create an account.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, company_name: company },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || "Could not create your account. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-muted)] px-4">
        <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 text-center">
          <div className="mb-4 flex justify-center"><Logo /></div>
          <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Check your email</h1>
          <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Confirm your address to
            finish setting up your Montague account.
          </p>
          <Button className="mt-5 w-full" variant="secondary" onClick={() => router.push("/login")}>
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-muted)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6">
          <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Create your account</h1>
          <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
            Start planning heavy-vehicle routes with Montague.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-[var(--color-foreground-muted)]">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              I agree to the Montague Terms of Service and acknowledge that route information is
              provided for planning purposes and does not guarantee compliance with road rules or
              permits.
            </label>

            {error && (
              <p role="alert" className="text-sm text-[var(--color-critical)]">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--color-foreground-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--color-primary)]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
