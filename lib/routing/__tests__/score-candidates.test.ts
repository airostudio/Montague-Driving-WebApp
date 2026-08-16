import { describe, expect, it } from "vitest";
import { scoreCandidates, selectBestCandidate } from "../score-candidates";
import type { RouteValidationResult } from "../validate-route";

function validation(overallStatus: RouteValidationResult["overallStatus"], criticalCount = 0): RouteValidationResult {
  return {
    overallStatus,
    checkedRestrictionCount: 1,
    issues: Array.from({ length: criticalCount }, () => ({
      restrictionId: null,
      severity: "critical" as const,
      issueType: "height" as const,
      title: "test",
      description: "test",
      truckValue: null,
      restrictionValue: null,
      unit: null,
      latitude: null,
      longitude: null,
    })),
  };
}

describe("scoreCandidates / selectBestCandidate", () => {
  it("never selects a route with a hard restriction over a slower clear route", () => {
    const fastButRestricted = { distanceMetres: 100_000, durationSeconds: 3600 };
    const slowButClear = { distanceMetres: 120_000, durationSeconds: 4500 };

    const scored = scoreCandidates([
      { candidate: fastButRestricted, validation: validation("restricted", 1) },
      { candidate: slowButClear, validation: validation("clear") },
    ]);

    const { best, hasViableAlternative } = selectBestCandidate(scored);
    expect(best.candidate).toBe(slowButClear);
    expect(hasViableAlternative).toBe(true);
  });

  it("returns the least-bad candidate with rejected=true when every candidate has a hard restriction", () => {
    const a = { distanceMetres: 100_000, durationSeconds: 3600 };
    const b = { distanceMetres: 90_000, durationSeconds: 3000 };

    const scored = scoreCandidates([
      { candidate: a, validation: validation("restricted", 2) },
      { candidate: b, validation: validation("restricted", 1) },
    ]);

    const { best, hasViableAlternative } = selectBestCandidate(scored);
    expect(best.candidate).toBe(b);
    expect(hasViableAlternative).toBe(false);
    expect(best.rejected).toBe(true);
  });
});
