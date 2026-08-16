"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { HAZARDOUS_GOODS_CLASSES } from "@/types/database";
import { truckSchema, VEHICLE_TYPES } from "@/lib/validation/truck";
import type { Truck } from "@/types/database";
import { mmToMetres, kgToTonnes } from "@/lib/utils/units";

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  rigid: "Rigid",
  prime_mover: "Prime Mover",
  semi_trailer: "Semi Trailer",
  b_double: "B-Double",
  b_triple: "B-Triple",
  road_train: "Road Train",
  pbs: "PBS",
  other: "Other",
};

export function TruckForm({ truck }: { truck?: Truck }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState(truck?.name ?? "");
  const [registration, setRegistration] = useState(truck?.registration ?? "");
  const [vehicleType, setVehicleType] = useState(truck?.vehicle_type ?? "semi_trailer");
  const [heightM, setHeightM] = useState(truck ? String(mmToMetres(truck.height_mm)) : "4.30");
  const [widthM, setWidthM] = useState(truck ? String(mmToMetres(truck.width_mm)) : "2.50");
  const [lengthM, setLengthM] = useState(truck ? String(mmToMetres(truck.length_mm)) : "19.00");
  const [weightT, setWeightT] = useState(truck ? String(kgToTonnes(truck.actual_weight_kg)) : "42.5");
  const [axleCount, setAxleCount] = useState(truck ? String(truck.axle_count) : "6");
  const [trailerCount, setTrailerCount] = useState(truck ? String(truck.trailer_count) : "1");
  const [hazGoods, setHazGoods] = useState<string[]>(truck?.hazardous_goods_types ?? []);
  const [customMargin, setCustomMargin] = useState(
    truck?.custom_height_safety_margin_mm != null ? String(truck.custom_height_safety_margin_mm) : ""
  );
  const [notes, setNotes] = useState(truck?.notes ?? "");
  const [active, setActive] = useState(truck?.active ?? true);

  function toggleHazGoods(value: string) {
    setHazGoods((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const parsed = truckSchema.safeParse({
      name,
      registration,
      vehicleType,
      heightM,
      widthM,
      lengthM,
      weightT,
      axleCount,
      trailerCount,
      hazardousGoodsTypes: hazGoods,
      customHeightSafetyMarginMm: customMargin === "" ? null : customMargin,
      notes,
      active,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const url = truck ? `/api/trucks/${truck.id}` : "/api/trucks";
    const method = truck ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setFormError(json.error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(`/trucks/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Vehicle</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Vehicle name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kenworth T610" />
            <FieldError message={errors.name} />
          </div>
          <div>
            <Label htmlFor="registration">Registration</Label>
            <Input id="registration" value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="1ABC234" />
          </div>
          <div>
            <Label htmlFor="vehicleType">Vehicle type</Label>
            <Select id="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>{VEHICLE_TYPE_LABELS[type]}</option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Dimensions</h2>
        <p className="text-xs text-[var(--color-foreground-muted)]">Entered in metres, stored internally in millimetres.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="heightM">Height (m)</Label>
            <Input id="heightM" type="number" step="0.01" value={heightM} onChange={(e) => setHeightM(e.target.value)} />
            <FieldError message={errors.heightM} />
          </div>
          <div>
            <Label htmlFor="widthM">Width (m)</Label>
            <Input id="widthM" type="number" step="0.01" value={widthM} onChange={(e) => setWidthM(e.target.value)} />
            <FieldError message={errors.widthM} />
          </div>
          <div>
            <Label htmlFor="lengthM">Length (m)</Label>
            <Input id="lengthM" type="number" step="0.01" value={lengthM} onChange={(e) => setLengthM(e.target.value)} />
            <FieldError message={errors.lengthM} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Weight & axles</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="weightT">Actual operating weight (t)</Label>
            <Input id="weightT" type="number" step="0.1" value={weightT} onChange={(e) => setWeightT(e.target.value)} />
            <FieldError message={errors.weightT} />
          </div>
          <div>
            <Label htmlFor="axleCount">Axle count</Label>
            <Input id="axleCount" type="number" value={axleCount} onChange={(e) => setAxleCount(e.target.value)} />
            <FieldError message={errors.axleCount} />
          </div>
          <div>
            <Label htmlFor="trailerCount">Trailer count</Label>
            <Input id="trailerCount" type="number" value={trailerCount} onChange={(e) => setTrailerCount(e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Dangerous goods</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {HAZARDOUS_GOODS_CLASSES.map((cls) => (
            <label key={cls} className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
              <input type="checkbox" checked={hazGoods.includes(cls)} onChange={() => toggleHazGoods(cls)} />
              {cls}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Safety</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="customMargin">Custom clearance margin (mm, optional)</Label>
            <Input
              id="customMargin"
              type="number"
              value={customMargin}
              onChange={(e) => setCustomMargin(e.target.value)}
              placeholder="Uses company default if blank"
            />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {truck && (
          <label className="mt-4 flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active (available for route planning)
          </label>
        )}
      </section>

      {formError && <p className="text-sm text-[var(--color-critical)]">{formError}</p>}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {loading ? "Saving…" : truck ? "Save changes" : "Save truck"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
