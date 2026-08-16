import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { restrictionSchema } from "@/lib/validation/restriction";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in required.", 401);

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  let query = supabase.from("road_restrictions").select("*").order("created_at", { ascending: false });
  if (state) query = query.eq("state_code", state);
  if (type) query = query.eq("restriction_type", type);
  if (status) query = query.eq("verification_status", status);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query.limit(200);
  if (error) return apiError("QUERY_FAILED", "Could not load restrictions.", 500);
  return apiSuccess(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in required.", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("auth_user_id", user.id)
    .single();

  if (profile?.role !== "platform_admin") {
    return apiError("FORBIDDEN", "Only platform admins can manage restriction records.", 403);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.", 400);
  }

  const parsed = restrictionSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", parsed.error.issues[0]?.message ?? "Invalid restriction data.", 400);
  }
  const input = parsed.data;

  const { data: restriction, error } = await supabase
    .from("road_restrictions")
    .insert({
      country_code: "AU",
      state_code: input.stateCode || null,
      restriction_type: input.restrictionType,
      name: input.name,
      road_name: input.roadName || null,
      description: input.description || null,
      latitude: input.latitude,
      longitude: input.longitude,
      max_height_mm: input.maxHeightMm ?? null,
      max_width_mm: input.maxWidthMm ?? null,
      max_length_mm: input.maxLengthMm ?? null,
      max_weight_kg: input.maxWeightKg ?? null,
      max_axles: input.maxAxles ?? null,
      restricted_vehicle_classes: input.restrictedVehicleClasses,
      restricted_hazardous_goods: input.restrictedHazardousGoods,
      direction: input.direction,
      permit_required: input.permitRequired,
      effective_from: input.effectiveFrom || null,
      effective_until: input.effectiveUntil || null,
      curfew_description: input.curfewDescription || null,
      source_name: input.sourceName,
      source_url: input.sourceUrl || null,
      source_reference: input.sourceReference || null,
      verification_status: input.verificationStatus,
      verified_at: input.verificationStatus === "verified" ? new Date().toISOString() : null,
      is_development_data: input.isDevelopmentData,
    })
    .select()
    .single();

  if (error || !restriction) {
    console.error("Failed to create restriction", error);
    return apiError("CREATE_FAILED", "Could not save this restriction record.", 500);
  }

  await supabase.from("audit_events").insert({
    company_id: profile.company_id,
    user_id: profile.id,
    action: "restriction.created",
    entity_type: "road_restriction",
    entity_id: restriction.id,
    metadata: { name: restriction.name },
  });

  return apiSuccess(restriction, 201);
}
