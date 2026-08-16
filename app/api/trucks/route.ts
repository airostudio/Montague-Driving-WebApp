import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { truckSchema } from "@/lib/validation/truck";
import { metresToMm, tonnesToKg } from "@/lib/utils/units";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in required.", 401);

  const { data, error } = await supabase
    .from("trucks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return apiError("QUERY_FAILED", "Could not load trucks.", 500);
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

  if (!profile?.company_id) return apiError("NO_COMPANY", "No company linked to this account.", 403);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.", 400);
  }

  const parsed = truckSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", parsed.error.issues[0]?.message ?? "Invalid truck data.", 400);
  }
  const input = parsed.data;

  const { data: truck, error } = await supabase
    .from("trucks")
    .insert({
      company_id: profile.company_id,
      name: input.name,
      registration: input.registration || null,
      vehicle_type: input.vehicleType,
      height_mm: metresToMm(input.heightM),
      width_mm: metresToMm(input.widthM),
      length_mm: metresToMm(input.lengthM),
      actual_weight_kg: tonnesToKg(input.weightT),
      axle_count: input.axleCount,
      trailer_count: input.trailerCount,
      hazardous_goods_types: input.hazardousGoodsTypes,
      custom_height_safety_margin_mm: input.customHeightSafetyMarginMm ?? null,
      notes: input.notes || null,
      active: input.active,
    })
    .select()
    .single();

  if (error || !truck) {
    console.error("Failed to create truck", error);
    return apiError("CREATE_FAILED", "Could not save this truck. Please try again.", 500);
  }

  await supabase.from("audit_events").insert({
    company_id: profile.company_id,
    user_id: profile.id,
    action: "truck.created",
    entity_type: "truck",
    entity_id: truck.id,
    metadata: { name: truck.name },
  });

  return apiSuccess(truck, 201);
}
