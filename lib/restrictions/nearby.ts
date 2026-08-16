import type { SupabaseClient } from "@supabase/supabase-js";
import { simplifyPath } from "@/lib/routing/polyline";
import type { Coordinate } from "@/lib/routing/types";
import type { RoadRestriction } from "@/types/database";

const DEFAULT_BUFFER_METRES = Number(process.env.ROUTE_RESTRICTION_BUFFER_METRES ?? 30);

export async function findRestrictionsNearPath(
  supabase: SupabaseClient,
  path: Coordinate[],
  bufferMetres: number = DEFAULT_BUFFER_METRES
): Promise<RoadRestriction[]> {
  if (path.length < 2) return [];

  const points = simplifyPath(path).map((p) => [p.longitude, p.latitude]);

  const { data, error } = await supabase.rpc("restrictions_near_route", {
    route_points: points,
    buffer_metres: bufferMetres,
  });

  if (error) {
    throw new Error(`Restriction lookup failed: ${error.message}`);
  }

  return (data ?? []) as RoadRestriction[];
}
