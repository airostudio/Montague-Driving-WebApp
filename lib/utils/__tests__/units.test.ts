import { describe, expect, it } from "vitest";
import { metresToMm, mmToMetres, tonnesToKg, kgToTonnes, formatMetres, formatTonnes } from "../units";

describe("unit conversion", () => {
  it("converts metres to millimetres", () => {
    expect(metresToMm(4.3)).toBe(4300);
  });

  it("converts tonnes to kilograms", () => {
    expect(tonnesToKg(42.5)).toBe(42500);
  });

  it("round-trips mm/metres", () => {
    expect(mmToMetres(metresToMm(19.0))).toBeCloseTo(19.0);
  });

  it("round-trips kg/tonnes", () => {
    expect(kgToTonnes(tonnesToKg(62.5))).toBeCloseTo(62.5);
  });

  it("formats metres for display", () => {
    expect(formatMetres(4300)).toBe("4.30 m");
  });

  it("formats tonnes for display", () => {
    expect(formatTonnes(42500)).toBe("42.5 t");
  });
});
