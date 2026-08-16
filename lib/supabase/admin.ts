import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client. NEVER import this from client components or expose
// its key to the browser. Only used server-side for privileged operations
// such as data import jobs that bypass RLS by design.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase service role client is not configured.");
  }

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
