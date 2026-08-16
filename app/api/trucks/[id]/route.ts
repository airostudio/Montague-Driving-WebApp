import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { truckSchema } from "@/lib/validation/truck";
import { metresToMm, tonnesToKg } from "@/lib/utils/units";

async function loadOwnedTruck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: apiError("UNAUTHENTICATED", "Sign in required.", 401) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile?.company_id) return { error: apiError("NO_COMPANY", "No company linked.", 403) };

  const { data: truck } = await supabase.from("trucks").select("*").eq("id", id).single();
  if (!truck || truck.company_id !== profile.company_id) {
    return { error: apiError("NOT_FOUND", "Truck not found.", 404) };
  }

  const canManage = ["fleet_manager", "company_admin", "platform_admin"].includes(profile.role);
  return { truck, profile, canManage };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await loadOwnedTruck(supabase, id);
  if (ctx.error) return ctx.error;
  if (!ctx.canManage) return apiError("FORBIDDEN", "You cannot edit trucks.", 403);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.", 400);
  }

  if (typeof payload.active === "boolean" && Object.keys(payload).length === 1) {
    const { data, error } = await supabase
      .from("trucks")
      .update({ active: payload.active })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return apiError("UPDATE_FAILED", "Could not update truck status.", 500);
    return apiSuccess(data);
  }

  const parsed = truckSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", parsed.error.issues[0]?.message ?? "Invalid truck data.", 400);
  }
  const input = parsed.data;

  const { data, error } = await supabase
    .from("trucks")
    .update({
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
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return apiError("UPDATE_FAILED", "Could not update this truck.", 500);

  await supabase.from("audit_events").insert({
    company_id: ctx.profile!.company_id,
    user_id: ctx.profile!.id,
    action: "truck.updated",
    entity_type: "truck",
    entity_id: id,
    metadata: { name: input.name },
  });

  return apiSuccess(data);
}
