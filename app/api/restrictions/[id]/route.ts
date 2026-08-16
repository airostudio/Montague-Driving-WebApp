import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

async function requirePlatformAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: apiError("UNAUTHENTICATED", "Sign in required.", 401) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("auth_user_id", user.id)
    .single();

  if (profile?.role !== "platform_admin") {
    return { error: apiError("FORBIDDEN", "Only platform admins can manage restriction records.", 403) };
  }
  return { profile };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requirePlatformAdmin(supabase);
  if (auth.error) return auth.error;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.", 400);
  }

  const updates: Record<string, unknown> = {};
  if (payload.verificationStatus) {
    updates.verification_status = payload.verificationStatus;
    if (payload.verificationStatus === "verified") {
      updates.verified_at = new Date().toISOString();
    }
  }
  if (typeof payload.name === "string") updates.name = payload.name;
  if (typeof payload.description === "string") updates.description = payload.description;

  const { data, error } = await supabase
    .from("road_restrictions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return apiError("UPDATE_FAILED", "Could not update this restriction.", 500);

  await supabase.from("audit_events").insert({
    company_id: auth.profile!.company_id,
    user_id: auth.profile!.id,
    action: "restriction.updated",
    entity_type: "road_restriction",
    entity_id: id,
    metadata: updates,
  });

  return apiSuccess(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requirePlatformAdmin(supabase);
  if (auth.error) return auth.error;

  const { error } = await supabase.from("road_restrictions").delete().eq("id", id);
  if (error) return apiError("DELETE_FAILED", "Could not archive this restriction.", 500);

  await supabase.from("audit_events").insert({
    company_id: auth.profile!.company_id,
    user_id: auth.profile!.id,
    action: "restriction.archived",
    entity_type: "road_restriction",
    entity_id: id,
    metadata: {},
  });

  return apiSuccess({ id });
}
