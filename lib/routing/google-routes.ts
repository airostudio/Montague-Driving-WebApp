import { decodePolyline } from "./polyline";
import type {
  RoutingCandidate,
  RoutingProvider,
  RoutingRequest,
  RoutingResponse,
  RoutingWaypoint,
} from "./types";
import { RoutingProviderError } from "./types";

const COMPUTE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

// Only request the fields we actually use — Google Routes API bills/limits
// by field mask, and returning the whole response wastes quota and storage.
const FIELD_MASK = [
  "routes.distanceMeters",
  "routes.duration",
  "routes.polyline.encodedPolyline",
  "routes.travelAdvisory.tollInfo",
  "routes.legs.distanceMeters",
  "routes.legs.duration",
  "routes.legs.startLocation",
  "routes.legs.endLocation",
  "routes.legs.steps.navigationInstruction",
  "routes.legs.steps.distanceMeters",
  "routes.legs.steps.staticDuration",
].join(",");

function waypointPayload(point: RoutingWaypoint) {
  if (point.placeId) {
    return { placeId: point.placeId };
  }
  return {
    location: {
      latLng: { latitude: point.latitude, longitude: point.longitude },
    },
  };
}

function parseIsoDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(duration);
  return match ? Math.round(parseFloat(match[1])) : 0;
}

interface GoogleRoutesApiResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    polyline?: { encodedPolyline?: string };
    travelAdvisory?: { tollInfo?: unknown };
    legs?: Array<{
      distanceMeters?: number;
      duration?: string;
      startLocation?: { latLng?: { latitude: number; longitude: number } };
      endLocation?: { latLng?: { latitude: number; longitude: number } };
      steps?: Array<{
        navigationInstruction?: { instructions?: string };
        distanceMeters?: number;
        staticDuration?: string;
      }>;
    }>;
  }>;
  error?: { message?: string; status?: string };
}

export class GoogleRoutesProvider implements RoutingProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async calculateRoute(request: RoutingRequest): Promise<RoutingResponse> {
    const { vehicle, preferences } = request;

    // Truck / large-vehicle routing parameters, following the documented
    // ComputeRoutes vehicleInfo shape. Kept isolated here so this is the
    // single place to update if Google's field names change.
    const vehicleInfo = {
      totalAxleCount: vehicle.axleCount,
      totalHeightMm: vehicle.heightMm,
      totalLengthMm: vehicle.lengthMm,
      totalWidthMm: vehicle.widthMm,
      totalWeightKg: vehicle.weightKg,
      trailerInfo: vehicle.trailerInfo,
      hazardousGoodsTypes: vehicle.hazardousGoodsTypes,
    };

    const body = {
      origin: waypointPayload(request.origin),
      destination: waypointPayload(request.destination),
      intermediates: request.intermediateStops.map(waypointPayload),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE_OPTIMAL",
      computeAlternativeRoutes: true,
      routeModifiers: {
        avoidTolls: preferences.avoidTolls,
        avoidHighways: preferences.avoidHighways,
        avoidFerries: preferences.avoidFerries,
      },
      extraComputations: ["TOLLS"],
      vehicleInfo,
      languageCode: "en-AU",
      units: "METRIC",
      regionCode: "AU",
    };

    let response: Response;
    try {
      response = await fetch(COMPUTE_ROUTES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new RoutingProviderError(
        "PROVIDER_UNAVAILABLE",
        "Could not reach the routing provider."
      );
    }

    if (response.status === 429 || response.status === 403) {
      throw new RoutingProviderError(
        "QUOTA_EXCEEDED",
        "The routing provider quota has been exceeded."
      );
    }

    if (!response.ok) {
      throw new RoutingProviderError(
        "INVALID_REQUEST",
        "The routing provider rejected the request."
      );
    }

    const data = (await response.json()) as GoogleRoutesApiResponse;

    if (!data.routes || data.routes.length === 0) {
      throw new RoutingProviderError("NO_ROUTE_FOUND", "No route could be found.");
    }

    const candidates: RoutingCandidate[] = data.routes.map((route) => {
      const encodedPolyline = route.polyline?.encodedPolyline ?? "";
      return {
        distanceMetres: route.distanceMeters ?? 0,
        durationSeconds: parseIsoDuration(route.duration),
        hasTolls: Boolean(route.travelAdvisory?.tollInfo),
        encodedPolyline,
        path: decodePolyline(encodedPolyline),
        legs: (route.legs ?? []).map((leg) => ({
          startLocation: {
            latitude: leg.startLocation?.latLng?.latitude ?? 0,
            longitude: leg.startLocation?.latLng?.longitude ?? 0,
          },
          endLocation: {
            latitude: leg.endLocation?.latLng?.latitude ?? 0,
            longitude: leg.endLocation?.latLng?.longitude ?? 0,
          },
          distanceMetres: leg.distanceMeters ?? 0,
          durationSeconds: parseIsoDuration(leg.duration),
          steps: (leg.steps ?? []).map((step) => ({
            instruction: step.navigationInstruction?.instructions ?? "",
            distanceMetres: step.distanceMeters ?? 0,
            durationSeconds: parseIsoDuration(step.staticDuration),
          })),
        })),
      };
    });

    return { candidates };
  }
}

let cachedProvider: RoutingProvider | null = null;

export function getRoutingProvider(): RoutingProvider {
  if (cachedProvider) return cachedProvider;
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) {
    throw new RoutingProviderError(
      "PROVIDER_UNAVAILABLE",
      "GOOGLE_MAPS_SERVER_API_KEY is not configured."
    );
  }
  cachedProvider = new GoogleRoutesProvider(apiKey);
  return cachedProvider;
}
