import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Company, Profile } from "@/types/database";

export interface AuthContext {
  userId: string;
  email: string | null;
  profile: Profile;
}

export interface CompanyAuthContext extends AuthContext {
  company: Company;
}

/**
 * Resolves the authenticated user and their profile server-side. Never trust
 * a company/user id supplied by the client — this is the single source of
 * truth for "who is making this request".
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return null;

  return { userId: user.id, email: user.email ?? null, profile: profile as Profile };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/**
 * Requires an authenticated user AND a company association. Users without a
 * company yet (mid-onboarding) are redirected to /onboarding.
 */
export async function requireCompanyContext(): Promise<CompanyAuthContext> {
  const ctx = await requireAuthContext();
  if (!ctx.profile.company_id) redirect("/onboarding");

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", ctx.profile.company_id)
    .single();

  if (!company) redirect("/onboarding");

  return { ...ctx, company: company as Company };
}
