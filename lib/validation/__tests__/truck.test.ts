import { describe, expect, it } from "vitest";
import { truckSchema } from "../truck";

const validInput = {
  name: "Kenworth T610",
  registration: "1ABC234",
  vehicleType: "semi_trailer",
  heightM: "4.3",
  widthM: "2.5",
  lengthM: "19",
  weightT: "42.5",
  axleCount: "6",
  trailerCount: "1",
  hazardousGoodsTypes: [],
  active: true,
};

describe("truckSchema", () => {
  it("accepts valid truck dimensions", () => {
    const result = truckSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects zero height", () => {
    const result = truckSchema.safeParse({ ...validInput, heightM: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects negative weight", () => {
    const result = truckSchema.safeParse({ ...validInput, weightT: "-10" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer axle count", () => {
    const result = truckSchema.safeParse({ ...validInput, axleCount: "6.5" });
    expect(result.success).toBe(false);
  });

  it("rejects unrealistic dimensions", () => {
    const result = truckSchema.safeParse({ ...validInput, lengthM: "500" });
    expect(result.success).toBe(false);
  });
});
