"use client";

let loadPromise: Promise<void> | null = null;

/**
 * Loads the Google Maps JavaScript API once and caches the promise so
 * multiple components mounting simultaneously don't inject duplicate
 * script tags.
 */
export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured."));
  }

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = "__montagueGoogleMapsCallback";
    (window as unknown as Record<string, () => void>)[callbackName] = () => resolve();

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&callback=${callbackName}&region=AU&language=en-AU`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });

  return loadPromise;
}
