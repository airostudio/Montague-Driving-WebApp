// Canonical storage is millimetres and kilograms. These helpers convert
// to/from the metric display units shown to users (metres, tonnes).

export function mmToMetres(mm: number): number {
  return mm / 1000;
}

export function metresToMm(metres: number): number {
  return Math.round(metres * 1000);
}

export function kgToTonnes(kg: number): number {
  return kg / 1000;
}

export function tonnesToKg(tonnes: number): number {
  return Math.round(tonnes * 1000);
}

export function formatMetres(mm: number | null | undefined, fractionDigits = 2): string {
  if (mm === null || mm === undefined) return "—";
  return `${mmToMetres(mm).toFixed(fractionDigits)} m`;
}

export function formatTonnes(kg: number | null | undefined, fractionDigits = 1): string {
  if (kg === null || kg === undefined) return "—";
  return `${kgToTonnes(kg).toFixed(fractionDigits)} t`;
}

export function formatDistance(metres: number | null | undefined): string {
  if (metres === null || metres === undefined) return "—";
  const km = metres / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function formatDateAu(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTimeAu(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
