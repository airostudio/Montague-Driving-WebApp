export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RoutingWaypoint extends Coordinate {
  name?: string;
  placeId?: string;
}

export interface TrailerRoutingProfile {
  axleCount?: number;
}

export interface VehicleRoutingProfile {
  heightMm: number;
  widthMm: number;
  lengthMm: number;
  weightKg: number;
  axleCount: number;
  trailerInfo: TrailerRoutingProfile[];
  hazardousGoodsTypes: string[];
}

export interface RoutingPreferences {
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidFerries: boolean;
}

export interface RoutingRequest {
  origin: RoutingWaypoint;
  destination: RoutingWaypoint;
  intermediateStops: RoutingWaypoint[];
  vehicle: VehicleRoutingProfile;
  preferences: RoutingPreferences;
}

export interface RoutingLegStep {
  instruction: string;
  distanceMetres: number;
  durationSeconds: number;
}

export interface RoutingLeg {
  startLocation: Coordinate;
  endLocation: Coordinate;
  distanceMetres: number;
  durationSeconds: number;
  steps: RoutingLegStep[];
}

export interface RoutingCandidate {
  distanceMetres: number;
  durationSeconds: number;
  hasTolls: boolean;
  encodedPolyline: string;
  legs: RoutingLeg[];
  path: Coordinate[];
}

export interface RoutingResponse {
  candidates: RoutingCandidate[];
}

export class RoutingProviderError extends Error {
  code: "NO_ROUTE_FOUND" | "PROVIDER_UNAVAILABLE" | "QUOTA_EXCEEDED" | "INVALID_REQUEST";

  constructor(code: RoutingProviderError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "RoutingProviderError";
  }
}

export interface RoutingProvider {
  calculateRoute(request: RoutingRequest): Promise<RoutingResponse>;
}
