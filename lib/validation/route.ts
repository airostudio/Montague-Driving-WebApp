import { z } from "zod";

const waypointSchema = z.object({
  formattedAddress: z.string().min(1),
  placeId: z.string().optional().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

export const routeCalculationSchema = z.object({
  origin: waypointSchema,
  destination: waypointSchema,
  intermediateStops: z.array(waypointSchema).max(8).default([]),
  truckId: z.string().uuid("Select a valid truck"),
  avoidTolls: z.boolean().default(false),
  avoidHighways: z.boolean().default(false),
  avoidFerries: z.boolean().default(false),
});

export type RouteCalculationInput = z.infer<typeof routeCalculationSchema>;

export const routeSaveSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  origin: waypointSchema,
  destination: waypointSchema,
  intermediateStops: z.array(waypointSchema).max(8).default([]),
  truckId: z.string().uuid(),
  truckSnapshot: z.record(z.string(), z.unknown()),
  distanceMetres: z.number().int().nonnegative(),
  durationSeconds: z.number().int().nonnegative(),
  hasTolls: z.boolean(),
  encodedPolyline: z.string(),
  validationStatus: z.enum(["clear", "warning", "restricted", "unknown"]),
  checkedRestrictionCount: z.number().int().nonnegative(),
  routeRequest: z.record(z.string(), z.unknown()),
  routeResponseSummary: z.record(z.string(), z.unknown()),
  issues: z.array(
    z.object({
      restrictionId: z.string().uuid().nullable(),
      severity: z.enum(["info", "warning", "critical"]),
      issueType: z.string(),
      title: z.string(),
      description: z.string(),
      truckValue: z.number().nullable(),
      restrictionValue: z.number().nullable(),
      unit: z.string().nullable(),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
    })
  ),
});

export type RouteSaveInput = z.infer<typeof routeSaveSchema>;
