import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { routeSaveSchema } from "@/lib/validation/route";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "You must be signed in to save a route.", 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.", 400);
  }

  const parsed = routeSaveSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }
  const input = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile?.company_id) {
    return apiError("NO_COMPANY", "Your account is not linked to a company yet.", 403);
  }

  const { data: truck } = await supabase
    .from("trucks")
    .select("id, company_id")
    .eq("id", input.truckId)
    .single();

  if (!truck || truck.company_id !== profile.company_id) {
    return apiError("FORBIDDEN", "You do not have access to this truck.", 403);
  }

  const { data: route, error: routeError } = await supabase
    .from("routes")
    .insert({
      company_id: profile.company_id,
      created_by: profile.id,
      truck_id: input.truckId,
      name: input.name || null,
      origin_name: input.origin.formattedAddress,
      origin_place_id: input.origin.placeId,
      origin_lat: input.origin.latitude,
      origin_lng: input.origin.longitude,
      destination_name: input.destination.formattedAddress,
      destination_place_id: input.destination.placeId,
      destination_lat: input.destination.latitude,
      destination_lng: input.destination.longitude,
      distance_metres: input.distanceMetres,
      duration_seconds: input.durationSeconds,
      has_tolls: input.hasTolls,
      encoded_polyline: input.encodedPolyline,
      validation_status: input.validationStatus,
      checked_restriction_count: input.checkedRestrictionCount,
      truck_snapshot: input.truckSnapshot,
      route_request: input.routeRequest,
      route_response_summary: input.routeResponseSummary,
    })
    .select("id")
    .single();

  if (routeError || !route) {
    console.error("Failed to save route", routeError);
    return apiError("SAVE_FAILED", "Could not save this route. Please try again.", 500);
  }

  if (input.intermediateStops.length > 0) {
    const stops = input.intermediateStops.map((stop, index) => ({
      route_id: route.id,
      sequence: index + 1,
      name: stop.formattedAddress,
      place_id: stop.placeId,
      latitude: stop.latitude,
      longitude: stop.longitude,
      stop_type: "waypoint" as const,
    }));
    await supabase.from("route_stops").insert(stops);
  }

  if (input.issues.length > 0) {
    const issues = input.issues.map((issue) => ({
      route_id: route.id,
      restriction_id: issue.restrictionId,
      severity: issue.severity,
      issue_type: issue.issueType,
      title: issue.title,
      description: issue.description,
      truck_value: issue.truckValue,
      restriction_value: issue.restrictionValue,
      unit: issue.unit,
      latitude: issue.latitude,
      longitude: issue.longitude,
    }));
    await supabase.from("route_issues").insert(issues);
  }

  await supabase.from("audit_events").insert({
    company_id: profile.company_id,
    user_id: profile.id,
    action: "route.calculated",
    entity_type: "route",
    entity_id: route.id,
    metadata: { validation_status: input.validationStatus },
  });

  return apiSuccess({ routeId: route.id }, 201);
}
