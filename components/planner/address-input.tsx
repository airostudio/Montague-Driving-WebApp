"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google/maps-loader";
import { Input } from "@/components/ui/input";

export interface ResolvedAddress {
  formattedAddress: string;
  placeId: string | null;
  latitude: number;
  longitude: number;
}

const AUSTRALIA_BOUNDS = { north: -9, south: -44, east: 154, west: 112 };

export function AddressInput({
  id,
  placeholder,
  value,
  onChange,
  allowCurrentLocation = false,
}: {
  id: string;
  placeholder: string;
  value: ResolvedAddress | null;
  onChange: (address: ResolvedAddress | null) => void;
  allowCurrentLocation?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [text, setText] = useState(value?.formattedAddress ?? "");
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  // Keep the visible text in sync with an externally-changed value (e.g. the
  // parent clearing the field) without a setState-in-effect cascade.
  const [lastSyncedAddress, setLastSyncedAddress] = useState(value?.formattedAddress ?? "");
  if ((value?.formattedAddress ?? "") !== lastSyncedAddress) {
    setLastSyncedAddress(value?.formattedAddress ?? "");
    setText(value?.formattedAddress ?? "");
  }

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current) return;
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "au" },
          fields: ["formatted_address", "place_id", "geometry", "name"],
          bounds: AUSTRALIA_BOUNDS,
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const location = place.geometry?.location;
          if (!location) return;
          const resolved: ResolvedAddress = {
            formattedAddress: place.formatted_address ?? place.name ?? "",
            placeId: place.place_id ?? null,
            latitude: location.lat(),
            longitude: location.lng(),
          };
          setText(resolved.formattedAddress);
          onChange(resolved);
        });
        autocompleteRef.current = autocomplete;
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const resolved: ResolvedAddress = {
          formattedAddress: "Current location",
          placeId: null,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setText(resolved.formattedAddress);
        onChange(resolved);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  }

  return (
    <div>
      <Input
        id={id}
        ref={inputRef}
        placeholder={ready ? placeholder : "Loading address search…"}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (value) onChange(null);
        }}
        autoComplete="off"
      />
      {allowCurrentLocation && (
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="mt-1 text-xs font-medium text-[var(--color-primary)] disabled:opacity-50"
        >
          {locating ? "Locating…" : "Use current location"}
        </button>
      )}
    </div>
  );
}
