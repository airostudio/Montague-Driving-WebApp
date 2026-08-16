import { z } from "zod";

export const RESTRICTION_TYPES = [
  "height",
  "width",
  "length",
  "weight",
  "axle",
  "bridge",
  "tunnel",
  "road_access",
  "vehicle_class",
  "hazardous_goods",
  "curfew",
  "closure",
  "permit_required",
  "road_condition",
  "other",
] as const;

export const VERIFICATION_STATUSES = ["verified", "unverified", "expired", "needs_review"] as const;

export const restrictionSchema = z.object({
  stateCode: z.string().max(3).optional().nullable(),
  restrictionType: z.enum(RESTRICTION_TYPES),
  name: z.string().trim().min(1).max(200),
  roadName: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  maxHeightMm: z.coerce.number().int().positive().optional().nullable(),
  maxWidthMm: z.coerce.number().int().positive().optional().nullable(),
  maxLengthMm: z.coerce.number().int().positive().optional().nullable(),
  maxWeightKg: z.coerce.number().int().positive().optional().nullable(),
  maxAxles: z.coerce.number().int().positive().optional().nullable(),
  restrictedVehicleClasses: z.array(z.string()).optional().default([]),
  restrictedHazardousGoods: z.array(z.string()).optional().default([]),
  direction: z.enum(["both", "northbound", "southbound", "eastbound", "westbound"]).default("both"),
  permitRequired: z.boolean().default(false),
  effectiveFrom: z.string().optional().nullable(),
  effectiveUntil: z.string().optional().nullable(),
  curfewDescription: z.string().max(500).optional().nullable(),
  sourceName: z.string().min(1).max(200),
  sourceUrl: z.string().url().optional().nullable().or(z.literal("")),
  sourceReference: z.string().max(200).optional().nullable(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).default("unverified"),
  isDevelopmentData: z.boolean().default(false),
});

export type RestrictionFormValues = z.infer<typeof restrictionSchema>;
