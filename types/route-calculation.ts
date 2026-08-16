import type { Coordinate, RoutingLeg } from "@/lib/routing/types";
import type { RouteIssueDraft, RouteValidationResult } from "@/lib/routing/validate-route";
import type { Truck } from "@/types/database";

export interface RouteCalculationResult {
  route: {
    distanceMetres: number;
    durationSeconds: number;
    hasTolls: boolean;
    encodedPolyline: string;
    path: Coordinate[];
    legs: RoutingLeg[];
  };
  validation: RouteValidationResult;
  truck: Truck;
  heightSafetyMarginMm: number;
  hasViableAlternative: boolean;
  candidateCount: number;
  rejected: boolean;
}

export type { RouteIssueDraft };
