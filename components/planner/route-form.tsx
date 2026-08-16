"use client";

import { useState } from "react";
import { Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddressInput, type ResolvedAddress } from "./address-input";
import { SelectedVehicleSummary } from "./selected-vehicle-summary";
import type { Truck } from "@/types/database";

export interface RouteFormValues {
  truckId: string;
  origin: ResolvedAddress | null;
  destination: ResolvedAddress | null;
  stops: ResolvedAddress[];
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidFerries: boolean;
}

export function RouteForm({
  trucks,
  defaultTruckId,
  loading,
  loadingStage,
  onSubmit,
}: {
  trucks: Truck[];
  defaultTruckId?: string;
  loading: boolean;
  loadingStage: string | null;
  onSubmit: (values: RouteFormValues) => void;
}) {
  const [truckId, setTruckId] = useState(defaultTruckId ?? trucks[0]?.id ?? "");
  const [origin, setOrigin] = useState<ResolvedAddress | null>(null);
  const [destination, setDestination] = useState<ResolvedAddress | null>(null);
  const [stops, setStops] = useState<ResolvedAddress[]>([]);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidFerries, setAvoidFerries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTruck = trucks.find((t) => t.id === truckId);

  function addStop() {
    setStops((prev) => [...prev, { formattedAddress: "", placeId: null, latitude: 0, longitude: 0 }]);
  }

  function updateStop(index: number, value: ResolvedAddress | null) {
    setStops((prev) => prev.map((s, i) => (i === index ? value ?? s : s)));
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!truckId) {
      setError("Select a truck to plan a route.");
      return;
    }
    if (!origin || !destination) {
      setError("Choose both an origin and a destination.");
      return;
    }
    onSubmit({ truckId, origin, destination, stops: stops.filter((s) => s.formattedAddress), avoidTolls, avoidHighways, avoidFerries });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="truck">Truck</Label>
        <Select id="truck" value={truckId} onChange={(e) => setTruckId(e.target.value)}>
          {trucks.length === 0 && <option value="">No trucks available</option>}
          {trucks.map((truck) => (
            <option key={truck.id} value={truck.id}>{truck.name}{truck.registration ? ` · ${truck.registration}` : ""}</option>
          ))}
        </Select>
        {selectedTruck && <div className="mt-2"><SelectedVehicleSummary truck={selectedTruck} /></div>}
      </div>

      <div>
        <Label htmlFor="origin">From</Label>
        <AddressInput id="origin" placeholder="Origin address" value={origin} onChange={setOrigin} allowCurrentLocation />
      </div>

      <div>
        <Label htmlFor="destination">To</Label>
        <AddressInput id="destination" placeholder="Destination address" value={destination} onChange={setDestination} />
      </div>

      {stops.length > 0 && (
        <div className="space-y-2">
          <Label>Stops</Label>
          {stops.map((stop, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <AddressInput
                  id={`stop-${index}`}
                  placeholder={`Stop ${index + 1}`}
                  value={stop.formattedAddress ? stop : null}
                  onChange={(v) => updateStop(index, v)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeStop(index)}
                className="text-xs text-[var(--color-foreground-muted)] hover:text-[var(--color-critical)]"
                aria-label={`Remove stop ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={addStop} className="text-sm font-medium text-[var(--color-primary)]">
        + Add stop
      </button>

      <div>
        <Label>Options</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
            <input type="checkbox" checked={avoidTolls} onChange={(e) => setAvoidTolls(e.target.checked)} />
            Avoid tolls
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
            <input type="checkbox" checked={avoidHighways} onChange={(e) => setAvoidHighways(e.target.checked)} />
            Avoid highways
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
            <input type="checkbox" checked={avoidFerries} onChange={(e) => setAvoidFerries(e.target.checked)} />
            Avoid ferries
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--color-critical)]">{error}</p>}

      <Button type="submit" className="w-full" size="lg" loading={loading} disabled={trucks.length === 0}>
        {loading ? loadingStage ?? "Planning route…" : "Plan route"}
      </Button>
    </form>
  );
}
