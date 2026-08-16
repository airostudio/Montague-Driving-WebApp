"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google/maps-loader";
import type { Coordinate } from "@/lib/routing/types";
import type { RoadRestriction } from "@/types/database";

const RESTRICTION_COLORS: Record<string, string> = {
  height: "#b3261e",
  bridge: "#b3261e",
  tunnel: "#b3261e",
  width: "#b3261e",
  length: "#b3261e",
  weight: "#9a6300",
  axle: "#9a6300",
  closure: "#b3261e",
  curfew: "#9a6300",
  permit_required: "#9a6300",
  hazardous_goods: "#b3261e",
  vehicle_class: "#9a6300",
  road_access: "#9a6300",
  road_condition: "#46505c",
  other: "#46505c",
};

const MELBOURNE_CENTER = { latitude: -37.8136, longitude: 144.9631 };

export interface RouteMapProps {
  path?: Coordinate[];
  origin?: Coordinate | null;
  destination?: Coordinate | null;
  stops?: Coordinate[];
  restrictions?: RoadRestriction[];
  selectedRestrictionId?: string | null;
  onSelectRestriction?: (restriction: RoadRestriction | null) => void;
  className?: string;
}

export function RouteMap({
  path = [],
  origin,
  destination,
  stops = [],
  restrictions = [],
  selectedRestrictionId,
  onSelectRestriction,
  className,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: MELBOURNE_CENTER.latitude, lng: MELBOURNE_CENTER.longitude },
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        infoWindowRef.current = new google.maps.InfoWindow();
      })
      .catch((err) => setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Route polyline
  useEffect(() => {
    if (!mapRef.current) return;
    polylineRef.current?.setMap(null);
    if (path.length === 0) return;

    polylineRef.current = new google.maps.Polyline({
      path: path.map((p) => ({ lat: p.latitude, lng: p.longitude })),
      geodesic: true,
      strokeColor: "#2454a8",
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map: mapRef.current,
    });

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
    mapRef.current.fitBounds(bounds, 48);
  }, [path]);

  // Origin / destination / stop markers + restriction markers
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (origin) {
      markersRef.current.push(
        new google.maps.Marker({
          position: { lat: origin.latitude, lng: origin.longitude },
          map: mapRef.current,
          label: { text: "A", color: "white", fontSize: "12px", fontWeight: "700" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#2454a8",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })
      );
    }
    if (destination) {
      markersRef.current.push(
        new google.maps.Marker({
          position: { lat: destination.latitude, lng: destination.longitude },
          map: mapRef.current,
          label: { text: "B", color: "white", fontSize: "12px", fontWeight: "700" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#14181f",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })
      );
    }
    stops.forEach((stop, index) => {
      markersRef.current.push(
        new google.maps.Marker({
          position: { lat: stop.latitude, lng: stop.longitude },
          map: mapRef.current,
          label: { text: String(index + 1), color: "white", fontSize: "11px" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#5b6472",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })
      );
    });

    restrictions.forEach((restriction) => {
      const color = RESTRICTION_COLORS[restriction.restriction_type] ?? RESTRICTION_COLORS.other;
      const isSelected = restriction.id === selectedRestrictionId;
      const marker = new google.maps.Marker({
        position: { lat: restriction.latitude, lng: restriction.longitude },
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 10 : 7,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        zIndex: isSelected ? 999 : undefined,
      });
      marker.addListener("click", () => onSelectRestriction?.(restriction));
      markersRef.current.push(marker);
    });
  }, [origin, destination, stops, restrictions, selectedRestrictionId, onSelectRestriction]);

  return (
    <div className={className}>
      <div ref={containerRef} className="h-full w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-inset)]" role="img" aria-label="Route map" />
      {error && (
        <div className="mt-2 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-warning)]">
          Map could not be loaded: {error}
        </div>
      )}
    </div>
  );
}
