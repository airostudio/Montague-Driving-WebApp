import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { routeCalculationSchema } from "@/lib/validation/route";
import { getRoutingProvider } from "@/lib/routing/google-routes";
import { RoutingProviderError } from "@/lib/routing/types";
import { findRestrictionsNearPath } from "@/lib/restrictions/nearby";
import { validateRoute } from "@/lib/routing/validate-route";
import { scoreCandidates, selectBestCandidate } from "@/lib/routing/score-candidates";
import { checkRateLimit, ROUTE_CALCULATION_LIMIT, ROUTE_CALCULATION_WINDOW_MS } from "@/lib/utils/rate-limit";
import type { Truck } from "@/types/database";

const DEFAULT_HEIGHT_MARGIN = Number(process.env.DEFAULT_HEIGHT_SAFETY_MARGIN_MM ?? 100);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "You must be signed in to plan a route.", 401);
  }

  const rateLimit = checkRateLimit(
    `route-calc:${user.id}`,
    ROUTE_CALCULATION_LIMIT,
    ROUTE_CALCULATION_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many route calculations in a short period. Please wait before trying again.",
      429
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.", 400);
  }

  const parsed = routeCalculationSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }
  const input = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile?.company_id) {
    return apiError("NO_COMPANY", "Your account is not linked to a company yet.", 403);
  }

  const { data: truck, error: truckError } = await supabase
    .from("trucks")
    .select("*")
    .eq("id", input.truckId)
    .single<Truck>();

  if (truckError || !truck) {
    return apiError("TRUCK_NOT_FOUND", "Selected truck could not be found.", 404);
  }

  if (truck.company_id !== profile.company_id) {
    return apiError("FORBIDDEN", "You do not have access to this truck.", 403);
  }

  if (!truck.active) {
    return apiError("TRUCK_INACTIVE", "This truck is archived and cannot be used for planning.", 400);
  }

  const { data: company } = await supabase
    .from("companies")
    .select("height_safety_margin_mm")
    .eq("id", profile.company_id)
    .single();

  const heightSafetyMarginMm =
    truck.custom_height_safety_margin_mm ??
    company?.height_safety_margin_mm ??
    DEFAULT_HEIGHT_MARGIN;

  const vehicleProfile = {
    heightMm: truck.height_mm,
    widthMm: truck.width_mm,
    lengthMm: truck.length_mm,
    weightKg: truck.actual_weight_kg,
    axleCount: truck.axle_count,
    trailerInfo: Array.from({ length: truck.trailer_count }, () => ({})),
    hazardousGoodsTypes: truck.hazardous_goods_types ?? [],
  };

  let routingResponse;
  try {
    const provider = getRoutingProvider();
    routingResponse = await provider.calculateRoute({
      origin: {
        latitude: input.origin.latitude,
        longitude: input.origin.longitude,
        placeId: input.origin.placeId ?? undefined,
        name: input.origin.formattedAddress,
      },
      destination: {
        latitude: input.destination.latitude,
        longitude: input.destination.longitude,
        placeId: input.destination.placeId ?? undefined,
        name: input.destination.formattedAddress,
      },
      intermediateStops: input.intermediateStops.map((s) => ({
        latitude: s.latitude,
        longitude: s.longitude,
        placeId: s.placeId ?? undefined,
        name: s.formattedAddress,
      })),
      vehicle: vehicleProfile,
      preferences: {
        avoidTolls: input.avoidTolls,
        avoidHighways: input.avoidHighways,
        avoidFerries: input.avoidFerries,
      },
    });
  } catch (err) {
    if (err instanceof RoutingProviderError) {
      const status = err.code === "NO_ROUTE_FOUND" ? 404 : 502;
      return apiError(err.code, humanizeRoutingError(err), status);
    }
    console.error("Route calculation failed", err);
    return apiError("PROVIDER_UNAVAILABLE", "We couldn't calculate this route. Please try again.", 502);
  }

  if (routingResponse.candidates.length === 0) {
    return apiError("NO_ROUTE_FOUND", "No suitable route could be found for this vehicle.", 404);
  }

  const evaluated = [];
  for (const candidate of routingResponse.candidates) {
    let restrictions;
    try {
      restrictions = await findRestrictionsNearPath(supabase, candidate.path);
    } catch (err) {
      console.error("Restriction lookup failed", err);
      restrictions = [];
    }
    const validation = validateRoute(restrictions, vehicleProfile, truck.vehicle_type, {
      heightSafetyMarginMm,
    });
    evaluated.push({ candidate, validation });
  }

  const scored = scoreCandidates(evaluated);
  const { best, hasViableAlternative } = selectBestCandidate(scored);

  return apiSuccess({
    route: {
      distanceMetres: best.candidate.distanceMetres,
      durationSeconds: best.candidate.durationSeconds,
      hasTolls: best.candidate.hasTolls,
      encodedPolyline: best.candidate.encodedPolyline,
      path: best.candidate.path,
      legs: best.candidate.legs,
    },
    validation: best.validation,
    truck,
    heightSafetyMarginMm,
    hasViableAlternative,
    candidateCount: routingResponse.candidates.length,
    rejected: best.rejected,
  });
}

function humanizeRoutingError(err: RoutingProviderError): string {
  switch (err.code) {
    case "NO_ROUTE_FOUND":
      return "No suitable route could be found. Check the addresses and try again.";
    case "QUOTA_EXCEEDED":
      return "The routing service is temporarily unavailable due to demand. Please try again shortly.";
    case "PROVIDER_UNAVAILABLE":
      return "The routing service is currently unavailable. Please try again shortly.";
    default:
      return "We couldn't calculate this route. Check the addresses and try again.";
  }
}
