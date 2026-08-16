import type { RouteValidationResult } from "./validate-route";

export interface ScoredCandidate<T> {
  candidate: T;
  validation: RouteValidationResult;
  score: number;
  rejected: boolean;
}

const HARD_RESTRICTION_PENALTY = 1_000_000;
const WARNING_PENALTY = 5_000;
const UNKNOWN_PENALTY = 500;
const DURATION_WEIGHT = 1; // per second
const DISTANCE_WEIGHT = 0.2; // per metre

/**
 * Ranks candidate routes so the fastest route is never chosen just because
 * it's fastest — a confirmed hard restriction rejects a candidate outright,
 * warnings and unverified sections are penalised, and only then do time and
 * distance break ties.
 */
export function scoreCandidates<T extends { distanceMetres: number; durationSeconds: number }>(
  candidates: Array<{ candidate: T; validation: RouteValidationResult }>
): ScoredCandidate<T>[] {
  return candidates
    .map(({ candidate, validation }) => {
      const criticalCount = validation.issues.filter((i) => i.severity === "critical").length;
      const warningCount = validation.issues.filter((i) => i.severity === "warning").length;
      const unknownExposure = validation.overallStatus === "unknown" ? 1 : 0;

      const score =
        criticalCount * HARD_RESTRICTION_PENALTY +
        warningCount * WARNING_PENALTY +
        unknownExposure * UNKNOWN_PENALTY +
        candidate.durationSeconds * DURATION_WEIGHT +
        candidate.distanceMetres * DISTANCE_WEIGHT;

      return {
        candidate,
        validation,
        score,
        rejected: criticalCount > 0,
      };
    })
    .sort((a, b) => a.score - b.score);
}

/**
 * Selects the best viable candidate: the lowest-scoring route that isn't
 * rejected outright. If every candidate is rejected, returns the least-bad
 * one so it can still be shown to the user with its conflicts clearly
 * flagged — never silently hidden.
 */
export function selectBestCandidate<T>(scored: ScoredCandidate<T>[]): {
  best: ScoredCandidate<T>;
  hasViableAlternative: boolean;
} {
  const viable = scored.find((c) => !c.rejected);
  if (viable) {
    return { best: viable, hasViableAlternative: scored.length > 1 };
  }
  return { best: scored[0], hasViableAlternative: false };
}
