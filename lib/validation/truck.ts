import { z } from "zod";

export const VEHICLE_TYPES = [
  "rigid",
  "prime_mover",
  "semi_trailer",
  "b_double",
  "b_triple",
  "road_train",
  "pbs",
  "other",
] as const;

export const truckSchema = z.object({
  name: z.string().trim().min(1, "Vehicle name is required").max(120),
  registration: z.string().trim().max(20).optional().or(z.literal("")),
  vehicleType: z.enum(VEHICLE_TYPES),
  heightM: z.coerce.number().positive("Height must be greater than zero").max(10, "Height seems unrealistic"),
  widthM: z.coerce.number().positive("Width must be greater than zero").max(6, "Width seems unrealistic"),
  lengthM: z.coerce.number().positive("Length must be greater than zero").max(60, "Length seems unrealistic"),
  weightT: z.coerce.number().positive("Weight must be greater than zero").max(200, "Weight seems unrealistic"),
  axleCount: z.coerce.number().int().positive("Axle count must be a positive whole number").max(20),
  trailerCount: z.coerce.number().int().min(0).max(4),
  hazardousGoodsTypes: z.array(z.string()).default([]),
  customHeightSafetyMarginMm: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export type TruckFormValues = z.infer<typeof truckSchema>;
