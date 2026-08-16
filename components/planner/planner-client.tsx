"use client";

import { useState } from "react";
import { RouteForm, type RouteFormValues } from "./route-form";
import { RouteSummary } from "./route-summary";
import { RouteMap } from "@/components/map/route-map";
import { MapLegend } from "@/components/map/map-legend";
import { RestrictionDetailCard } from "@/components/map/restriction-detail-card";
import type { Truck, RoadRestriction } from "@/types/database";
import type { RouteCalculationResult } from "@/types/route-calculation";

const LOADING_STAGES = [
  "Calculating truck route…",
  "Checking vehicle restrictions…",
  "Checking known clearances…",
  "Preparing route…",
];

export function PlannerClient({ trucks, defaultTruckId }: { trucks: Truck[]; defaultTruckId?: string }) {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [result, setResult] = useState<RouteCalculationResult | null>(null);
  const [lastRequest, setLastRequest] = useState<RouteFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [restrictionsForMap, setRestrictionsForMap] = useState<RoadRestriction[]>([]);
  const [selectedRestriction, setSelectedRestriction] = useState<RoadRestriction | null>(null);

  async function handleSubmit(values: RouteFormValues) {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    setLastRequest(values);

    let stageIndex = 0;
    setLoadingStage(LOADING_STAGES[0]);
    const interval = setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, LOADING_STAGES.length - 1);
      setLoadingStage(LOADING_STAGES[stageIndex]);
    }, 1200);

    try {
      const res = await fetch("/api/routes/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: values.origin,
          destination: values.destination,
          intermediateStops: values.stops,
          truckId: values.truckId,
          avoidTolls: values.avoidTolls,
          avoidHighways: values.avoidHighways,
          avoidFerries: values.avoidFerries,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "We couldn't calculate this route. Check the addresses and try again.");
        return;
      }
      setResult(json.data);
      const restrictionIds = new Set(
        (json.data.validation.issues as { restrictionId: string | null }[])
          .map((i) => i.restrictionId)
          .filter(Boolean)
      );
      setRestrictionsForMap(
        Array.from(restrictionIds).map((id) => {
          const issue = json.data.validation.issues.find((i: { restrictionId: string }) => i.restrictionId === id);
          return {
            id,
            latitude: issue.latitude,
            longitude: issue.longitude,
            restriction_type: issue.issueType,
            name: issue.title,
            verification_status: "unverified",
            is_development_data: true,
            source_name: "Montague",
          } as unknown as RoadRestriction;
        })
      );
    } catch {
      setError("We couldn't calculate this route. Check the addresses and try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingStage(null);
    }
  }

  async function handleSave() {
    if (!result || !lastRequest) return;
    setSaving(true);
    try {
      const res = await fetch("/api/routes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: null,
          origin: lastRequest.origin,
          destination: lastRequest.destination,
          intermediateStops: lastRequest.stops,
          truckId: lastRequest.truckId,
          truckSnapshot: result.truck,
          distanceMetres: result.route.distanceMetres,
          durationSeconds: result.route.durationSeconds,
          hasTolls: result.route.hasTolls,
          encodedPolyline: result.route.encodedPolyline,
          validationStatus: result.validation.overallStatus,
          checkedRestrictionCount: result.validation.checkedRestrictionCount,
          routeRequest: lastRequest,
          routeResponseSummary: { legCount: result.route.legs.length },
          issues: result.validation.issues,
        }),
      });
      const json = await res.json();
      if (json.success) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-3.5rem-3.5rem)] lg:overflow-hidden">
      <div className="w-full lg:w-[380px] lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-white overflow-y-auto p-4 md:p-5">
        <RouteForm trucks={trucks} defaultTruckId={defaultTruckId} loading={loading} loadingStage={loadingStage} onSubmit={handleSubmit} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-h-[320px] p-4 md:p-5">
          <RouteMap
            path={result?.route.path}
            origin={lastRequest?.origin ?? undefined}
            destination={lastRequest?.destination ?? undefined}
            stops={lastRequest?.stops.filter((s) => s.latitude) ?? []}
            restrictions={restrictionsForMap}
            selectedRestrictionId={selectedRestriction?.id}
            onSelectRestriction={setSelectedRestriction}
            className="h-full min-h-[320px]"
          />
          <div className="mt-3">
            <MapLegend />
          </div>
        </div>

        {selectedRestriction && (
          <div className="px-4 pb-4 md:px-5">
            <RestrictionDetailCard restriction={selectedRestriction} onClose={() => setSelectedRestriction(null)} />
          </div>
        )}

        <div className="border-t border-[var(--color-border)] bg-white p-4 md:p-5">
          {error && (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-critical-border)] bg-[var(--color-critical-bg)] p-3 text-sm text-[var(--color-critical)]">
              {error}
            </p>
          )}
          {result && <RouteSummary result={result} onSave={handleSave} saving={saving} saved={saved} />}
          {!result && !error && (
            <p className="text-sm text-[var(--color-foreground-muted)]">
              Route results and restriction warnings will appear here after planning a route.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
