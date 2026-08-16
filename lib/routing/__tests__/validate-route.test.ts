import { describe, expect, it } from "vitest";
import { validateRoute } from "../validate-route";
import type { RoadRestriction } from "@/types/database";
import type { VehicleRoutingProfile } from "../types";

function makeRestriction(overrides: Partial<RoadRestriction>): RoadRestriction {
  return {
    id: "restriction-1",
    country_code: "AU",
    state_code: "VIC",
    restriction_type: "bridge",
    name: "Test Bridge",
    road_name: null,
    description: null,
    latitude: -37.8,
    longitude: 144.9,
    max_height_mm: null,
    max_width_mm: null,
    max_length_mm: null,
    max_weight_kg: null,
    max_axles: null,
    allowed_vehicle_classes: null,
    restricted_vehicle_classes: null,
    restricted_hazardous_goods: null,
    direction: "both",
    permit_required: false,
    effective_from: null,
    effective_until: null,
    curfew_description: null,
    source_name: "Test source",
    source_url: null,
    source_reference: null,
    verified_at: new Date().toISOString(),
    verification_status: "verified",
    is_development_data: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

const baseVehicle: VehicleRoutingProfile = {
  heightMm: 4300,
  widthMm: 2500,
  lengthMm: 19000,
  weightKg: 42500,
  axleCount: 6,
  trailerInfo: [{}],
  hazardousGoodsTypes: [],
};

describe("validateRoute — height restriction", () => {
  it("flags a route as restricted when the truck exceeds the bridge clearance outright", () => {
    const restriction = makeRestriction({ max_height_mm: 4200 });
    const result = validateRoute([restriction], baseVehicle, "semi_trailer", { heightSafetyMarginMm: 100 });

    expect(result.overallStatus).toBe("restricted");
    expect(result.issues[0].severity).toBe("critical");
  });
});

describe("validateRoute — clearance safety margin", () => {
  it("flags a warning-or-restricted result when clearance is within the safety margin", () => {
    // Truck 4300mm, bridge 4350mm, margin 100mm => required clearance 4400mm > 4350mm
    const restriction = makeRestriction({ max_height_mm: 4350 });
    const result = validateRoute([restriction], baseVehicle, "semi_trailer", { heightSafetyMarginMm: 100 });

    expect(["warning", "restricted"]).toContain(result.overallStatus);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe("validateRoute — safe clearance", () => {
  it("returns clear when the bridge clearance comfortably exceeds the truck height plus margin", () => {
    const vehicle: VehicleRoutingProfile = { ...baseVehicle, heightMm: 4200 };
    const restriction = makeRestriction({ max_height_mm: 4500 });
    const result = validateRoute([restriction], vehicle, "semi_trailer", { heightSafetyMarginMm: 100 });

    expect(result.overallStatus).toBe("clear");
    expect(result.issues).toHaveLength(0);
  });
});

describe("validateRoute — weight restriction", () => {
  it("flags a critical issue when the vehicle exceeds the weight limit", () => {
    const restriction = makeRestriction({ restriction_type: "weight", max_weight_kg: 40000, max_height_mm: null });
    const result = validateRoute([restriction], baseVehicle, "semi_trailer", { heightSafetyMarginMm: 100 });

    expect(result.overallStatus).toBe("restricted");
    expect(result.issues[0].issueType).toBe("weight");
  });
});

describe("validateRoute — width restriction", () => {
  it("flags a critical issue when the vehicle exceeds the width limit", () => {
    const restriction = makeRestriction({ restriction_type: "width", max_width_mm: 2400 });
    const result = validateRoute([restriction], baseVehicle, "semi_trailer", { heightSafetyMarginMm: 100 });

    expect(result.overallStatus).toBe("restricted");
    expect(result.issues[0].issueType).toBe("width");
  });
});

describe("validateRoute — route issue generation", () => {
  it("generates no issues and a clear status when there are no matching restrictions", () => {
    const result = validateRoute([], baseVehicle, "semi_trailer", { heightSafetyMarginMm: 100 });
    expect(result.overallStatus).toBe("clear");
    expect(result.checkedRestrictionCount).toBe(0);
  });

  it("never reports unknown restrictions as clear", () => {
    const restriction = makeRestriction({
      restriction_type: "road_access",
      verification_status: "needs_review",
      max_height_mm: null,
    });
    const result = validateRoute([restriction], baseVehicle, "semi_trailer", { heightSafetyMarginMm: 100 });
    expect(result.overallStatus).toBe("unknown");
  });

  it("flags a hazardous goods conflict", () => {
    const restriction = makeRestriction({
      restriction_type: "hazardous_goods",
      restricted_hazardous_goods: ["Class 1 - Explosives"],
    });
    const vehicle: VehicleRoutingProfile = { ...baseVehicle, hazardousGoodsTypes: ["Class 1 - Explosives"] };
    const result = validateRoute([restriction], vehicle, "semi_trailer", { heightSafetyMarginMm: 100 });
    expect(result.overallStatus).toBe("restricted");
  });
});
