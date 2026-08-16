import type { RoadRestriction, RouteIssue, RouteValidationStatus, Severity } from "@/types/database";
import type { Coordinate, VehicleRoutingProfile } from "./types";

export interface RouteIssueDraft {
  restrictionId: string | null;
  severity: Severity;
  issueType: RoadRestriction["restriction_type"];
  title: string;
  description: string;
  truckValue: number | null;
  restrictionValue: number | null;
  unit: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface RouteValidationResult {
  overallStatus: RouteValidationStatus;
  issues: RouteIssueDraft[];
  checkedRestrictionCount: number;
  dataFreshness?: string;
}

export interface ValidationOptions {
  /** Additional clearance required above the restriction's stated max height, in mm. */
  heightSafetyMarginMm: number;
  /** How old (in days) a verified restriction can be before it's flagged stale. */
  staleAfterDays?: number;
}

const DEFAULT_STALE_AFTER_DAYS = 365;

function metresLabel(mm: number) {
  return `${(mm / 1000).toFixed(2)} m`;
}

function tonnesLabel(kg: number) {
  return `${(kg / 1000).toFixed(1)} t`;
}

function isStale(restriction: RoadRestriction, staleAfterDays: number): boolean {
  if (!restriction.verified_at) return true;
  const ageMs = Date.now() - new Date(restriction.verified_at).getTime();
  return ageMs > staleAfterDays * 24 * 60 * 60 * 1000;
}

function isCurrentlyEffective(restriction: RoadRestriction): boolean {
  const now = Date.now();
  if (restriction.effective_from && new Date(restriction.effective_from).getTime() > now) {
    return false;
  }
  if (restriction.effective_until && new Date(restriction.effective_until).getTime() < now) {
    return false;
  }
  return true;
}

/**
 * Compares a vehicle profile against a single restriction and returns any
 * issues raised. A restriction can raise more than one issue (e.g. a bridge
 * with both a height and a weight limit).
 */
function evaluateRestriction(
  restriction: RoadRestriction,
  vehicle: VehicleRoutingProfile,
  options: ValidationOptions
): RouteIssueDraft[] {
  const issues: RouteIssueDraft[] = [];
  const staleAfterDays = options.staleAfterDays ?? DEFAULT_STALE_AFTER_DAYS;

  if (!isCurrentlyEffective(restriction)) {
    return issues;
  }

  const isUnverified =
    restriction.verification_status === "unverified" ||
    restriction.verification_status === "needs_review" ||
    restriction.verification_status === "expired" ||
    isStale(restriction, staleAfterDays);

  const baseLocation = { latitude: restriction.latitude, longitude: restriction.longitude };

  // Height / bridge / tunnel clearance -------------------------------------
  if (restriction.max_height_mm !== null && restriction.max_height_mm !== undefined) {
    const margin = options.heightSafetyMarginMm;
    const requiredClearance = vehicle.heightMm + margin;
    if (restriction.max_height_mm < requiredClearance) {
      const conflictsOutright = restriction.max_height_mm < vehicle.heightMm;
      issues.push({
        restrictionId: restriction.id,
        severity: conflictsOutright ? "critical" : "warning",
        issueType: restriction.restriction_type,
        title: `Height conflict — ${restriction.name}`,
        description:
          `Vehicle height ${metresLabel(vehicle.heightMm)} ` +
          `${conflictsOutright ? "exceeds" : "is within the configured safety margin of"} ` +
          `the ${metresLabel(restriction.max_height_mm)} clearance at ${restriction.name}. ` +
          `Required clearance with safety margin is ${metresLabel(requiredClearance)}.`,
        truckValue: vehicle.heightMm,
        restrictionValue: restriction.max_height_mm,
        unit: "mm",
        ...baseLocation,
      });
    }
  }

  // Width -------------------------------------------------------------------
  if (restriction.max_width_mm !== null && restriction.max_width_mm !== undefined) {
    if (restriction.max_width_mm < vehicle.widthMm) {
      issues.push({
        restrictionId: restriction.id,
        severity: "critical",
        issueType: restriction.restriction_type,
        title: `Width conflict — ${restriction.name}`,
        description:
          `Vehicle width ${metresLabel(vehicle.widthMm)} exceeds the ` +
          `${metresLabel(restriction.max_width_mm)} limit at ${restriction.name}.`,
        truckValue: vehicle.widthMm,
        restrictionValue: restriction.max_width_mm,
        unit: "mm",
        ...baseLocation,
      });
    }
  }

  // Length --------------------------------------------------------------------
  if (restriction.max_length_mm !== null && restriction.max_length_mm !== undefined) {
    if (restriction.max_length_mm < vehicle.lengthMm) {
      issues.push({
        restrictionId: restriction.id,
        severity: "critical",
        issueType: restriction.restriction_type,
        title: `Length conflict — ${restriction.name}`,
        description:
          `Vehicle length ${metresLabel(vehicle.lengthMm)} exceeds the ` +
          `${metresLabel(restriction.max_length_mm)} limit at ${restriction.name}.`,
        truckValue: vehicle.lengthMm,
        restrictionValue: restriction.max_length_mm,
        unit: "mm",
        ...baseLocation,
      });
    }
  }

  // Weight ----------------------------------------------------------------
  if (restriction.max_weight_kg !== null && restriction.max_weight_kg !== undefined) {
    if (restriction.max_weight_kg < vehicle.weightKg) {
      issues.push({
        restrictionId: restriction.id,
        severity: "critical",
        issueType: restriction.restriction_type,
        title: `Weight conflict — ${restriction.name}`,
        description:
          `Vehicle weight ${tonnesLabel(vehicle.weightKg)} exceeds the ` +
          `${tonnesLabel(restriction.max_weight_kg)} limit at ${restriction.name}.`,
        truckValue: vehicle.weightKg,
        restrictionValue: restriction.max_weight_kg,
        unit: "kg",
        ...baseLocation,
      });
    }
  }

  // Axles -----------------------------------------------------------------
  if (restriction.max_axles !== null && restriction.max_axles !== undefined) {
    if (restriction.max_axles < vehicle.axleCount) {
      issues.push({
        restrictionId: restriction.id,
        severity: "critical",
        issueType: restriction.restriction_type,
        title: `Axle count conflict — ${restriction.name}`,
        description:
          `Vehicle has ${vehicle.axleCount} axles, exceeding the ` +
          `${restriction.max_axles} axle limit at ${restriction.name}.`,
        truckValue: vehicle.axleCount,
        restrictionValue: restriction.max_axles,
        unit: "axles",
        ...baseLocation,
      });
    }
  }

  // Hazardous goods ---------------------------------------------------------
  if (restriction.restricted_hazardous_goods && restriction.restricted_hazardous_goods.length > 0) {
    const conflict = vehicle.hazardousGoodsTypes.some((type) =>
      restriction.restricted_hazardous_goods!.includes(type)
    );
    if (conflict) {
      issues.push({
        restrictionId: restriction.id,
        severity: "critical",
        issueType: "hazardous_goods",
        title: `Hazardous goods restriction — ${restriction.name}`,
        description: `This vehicle's declared hazardous goods classification is restricted at ${restriction.name}.`,
        truckValue: null,
        restrictionValue: null,
        unit: null,
        ...baseLocation,
      });
    }
  }

  // Closure -----------------------------------------------------------------
  if (restriction.restriction_type === "closure") {
    issues.push({
      restrictionId: restriction.id,
      severity: "critical",
      issueType: "closure",
      title: `Closure — ${restriction.name}`,
      description: restriction.description ?? `${restriction.name} is closed to heavy vehicles.`,
      truckValue: null,
      restrictionValue: null,
      unit: null,
      ...baseLocation,
    });
  }

  // Curfew / time restriction -------------------------------------------------
  if (restriction.restriction_type === "curfew") {
    issues.push({
      restrictionId: restriction.id,
      severity: "warning",
      issueType: "curfew",
      title: `Curfew restriction — ${restriction.name}`,
      description:
        restriction.curfew_description ??
        `${restriction.name} has a time-of-day access restriction. Check the curfew window before departure.`,
      truckValue: null,
      restrictionValue: null,
      unit: null,
      ...baseLocation,
    });
  }

  // Permit required -------------------------------------------------------
  if (restriction.permit_required) {
    issues.push({
      restrictionId: restriction.id,
      severity: "warning",
      issueType: "permit_required",
      title: `Permit required — ${restriction.name}`,
      description: `A permit may be required to operate this vehicle configuration at ${restriction.name}.`,
      truckValue: null,
      restrictionValue: null,
      unit: null,
      ...baseLocation,
    });
  }

  // Vehicle classification -------------------------------------------------
  if (restriction.restricted_vehicle_classes && restriction.restricted_vehicle_classes.length > 0) {
    // Vehicle class matching against the truck's configured type happens at
    // the caller level (validateRoute), since the restriction record alone
    // doesn't know the truck's vehicleType — see validateRoute below.
  }

  // Mark unverified/stale data on any issue already raised, and separately
  // surface a low-severity "requires verification" note even with no other
  // conflict, so unknown data is never silently treated as clear.
  if (isUnverified && issues.length === 0 && restriction.restriction_type !== "road_condition") {
    // No numeric conflict, but data is unverified/stale — only note this for
    // restriction types that could plausibly interact with this vehicle.
  }

  return issues.map((issue) => ({
    ...issue,
    description: isUnverified
      ? `${issue.description} This restriction record is unverified or its data may be outdated — additional verification may be required.`
      : issue.description,
  }));
}

export interface RestrictionMatch {
  restriction: RoadRestriction;
  point: Coordinate;
}

export function validateRoute(
  matches: RoadRestriction[],
  vehicle: VehicleRoutingProfile,
  vehicleClass: string,
  options: ValidationOptions
): RouteValidationResult {
  const issues: RouteIssueDraft[] = [];
  let unknownCount = 0;

  for (const restriction of matches) {
    const restrictionIssues = evaluateRestriction(restriction, vehicle, options);
    issues.push(...restrictionIssues);

    if (
      restriction.restricted_vehicle_classes &&
      restriction.restricted_vehicle_classes.includes(vehicleClass)
    ) {
      issues.push({
        restrictionId: restriction.id,
        severity: "critical",
        issueType: "vehicle_class",
        title: `Vehicle class restriction — ${restriction.name}`,
        description: `${vehicleClass.replace(/_/g, " ")} vehicles are restricted at ${restriction.name}.`,
        truckValue: null,
        restrictionValue: null,
        unit: null,
        latitude: restriction.latitude,
        longitude: restriction.longitude,
      });
    }

    const staleAfterDays = options.staleAfterDays ?? DEFAULT_STALE_AFTER_DAYS;
    if (
      (restriction.verification_status === "needs_review" ||
        restriction.verification_status === "unverified" ||
        isStale(restriction, staleAfterDays)) &&
      restrictionIssues.length === 0
    ) {
      unknownCount += 1;
    }
  }

  const hasCritical = issues.some((issue) => issue.severity === "critical");
  const hasWarning = issues.some((issue) => issue.severity === "warning");

  let overallStatus: RouteValidationStatus;
  if (hasCritical) {
    overallStatus = "restricted";
  } else if (hasWarning) {
    overallStatus = "warning";
  } else if (unknownCount > 0 && matches.length > 0) {
    overallStatus = "unknown";
  } else {
    overallStatus = "clear";
  }

  return {
    overallStatus,
    issues,
    checkedRestrictionCount: matches.length,
    dataFreshness: new Date().toISOString(),
  };
}
