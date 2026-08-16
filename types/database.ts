// Core domain types for Montague. These mirror the Supabase/PostgreSQL schema
// defined in supabase/migrations. Keep in sync with the migrations when the
// schema changes.

export type CountryCode = "AU";

export type AustralianStateCode =
  | "VIC"
  | "NSW"
  | "QLD"
  | "SA"
  | "WA"
  | "TAS"
  | "ACT"
  | "NT";

export type UserRole =
  | "driver"
  | "dispatcher"
  | "fleet_manager"
  | "company_admin"
  | "platform_admin";

export type VehicleType =
  | "rigid"
  | "prime_mover"
  | "semi_trailer"
  | "b_double"
  | "b_triple"
  | "road_train"
  | "pbs"
  | "other";

export type RestrictionType =
  | "height"
  | "width"
  | "length"
  | "weight"
  | "axle"
  | "bridge"
  | "tunnel"
  | "road_access"
  | "vehicle_class"
  | "hazardous_goods"
  | "curfew"
  | "closure"
  | "permit_required"
  | "road_condition"
  | "other";

export type VerificationStatus =
  | "verified"
  | "unverified"
  | "expired"
  | "needs_review";

export type RouteValidationStatus = "clear" | "warning" | "restricted" | "unknown";

export type Severity = "info" | "warning" | "critical";

export type RouteDirection = "both" | "northbound" | "southbound" | "eastbound" | "westbound";

export interface Company {
  id: string;
  name: string;
  abn: string | null;
  country_code: CountryCode;
  timezone: string;
  height_safety_margin_mm: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Truck {
  id: string;
  company_id: string;
  name: string;
  registration: string | null;
  vehicle_type: VehicleType;
  height_mm: number;
  width_mm: number;
  length_mm: number;
  actual_weight_kg: number;
  axle_count: number;
  trailer_count: number;
  hazardous_goods_types: string[];
  custom_height_safety_margin_mm: number | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trailer {
  id: string;
  company_id: string;
  name: string;
  registration: string | null;
  height_mm: number;
  width_mm: number;
  length_mm: number;
  weight_kg: number;
  axle_count: number;
  created_at: string;
  updated_at: string;
}

export interface SavedLocation {
  id: string;
  company_id: string;
  name: string;
  formatted_address: string;
  place_id: string | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadRestriction {
  id: string;
  country_code: CountryCode;
  state_code: AustralianStateCode | null;
  restriction_type: RestrictionType;
  name: string;
  road_name: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  max_height_mm: number | null;
  max_width_mm: number | null;
  max_length_mm: number | null;
  max_weight_kg: number | null;
  max_axles: number | null;
  allowed_vehicle_classes: string[] | null;
  restricted_vehicle_classes: string[] | null;
  restricted_hazardous_goods: string[] | null;
  direction: RouteDirection;
  permit_required: boolean;
  effective_from: string | null;
  effective_until: string | null;
  curfew_description: string | null;
  source_name: string;
  source_url: string | null;
  source_reference: string | null;
  verified_at: string | null;
  verification_status: VerificationStatus;
  is_development_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteRecord {
  id: string;
  company_id: string;
  created_by: string;
  truck_id: string | null;
  name: string | null;
  origin_name: string;
  origin_place_id: string | null;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_place_id: string | null;
  destination_lat: number;
  destination_lng: number;
  distance_metres: number;
  duration_seconds: number;
  has_tolls: boolean;
  encoded_polyline: string;
  validation_status: RouteValidationStatus;
  truck_snapshot: Record<string, unknown>;
  route_request: Record<string, unknown>;
  route_response_summary: Record<string, unknown>;
  checked_restriction_count: number;
  created_at: string;
  updated_at: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  sequence: number;
  name: string;
  place_id: string | null;
  latitude: number;
  longitude: number;
  stop_type: "waypoint" | "depot" | "delivery" | "rest";
  created_at: string;
}

export interface RouteIssue {
  id: string;
  route_id: string;
  restriction_id: string | null;
  severity: Severity;
  issue_type: RestrictionType;
  title: string;
  description: string;
  truck_value: number | null;
  restriction_value: number | null;
  unit: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface DataSource {
  id: string;
  name: string;
  jurisdiction: string;
  source_type: string;
  source_url: string | null;
  licence: string | null;
  update_frequency: string | null;
  last_import_at: string | null;
  last_success_at: string | null;
  active: boolean;
  created_at: string;
}

export interface DataImportJob {
  id: string;
  data_source_id: string;
  started_at: string;
  completed_at: string | null;
  status: "pending" | "running" | "succeeded" | "failed";
  records_received: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message: string | null;
}

export interface AuditEvent {
  id: string;
  company_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const AUSTRALIAN_STATES: { code: AustralianStateCode; name: string }[] = [
  { code: "VIC", name: "Victoria" },
  { code: "NSW", name: "New South Wales" },
  { code: "QLD", name: "Queensland" },
  { code: "SA", name: "South Australia" },
  { code: "WA", name: "Western Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NT", name: "Northern Territory" },
];

export const HAZARDOUS_GOODS_CLASSES = [
  "Class 1 - Explosives",
  "Class 2.1 - Flammable Gas",
  "Class 2.2 - Non-Flammable Gas",
  "Class 2.3 - Toxic Gas",
  "Class 3 - Flammable Liquid",
  "Class 4.1 - Flammable Solid",
  "Class 4.2 - Spontaneously Combustible",
  "Class 4.3 - Dangerous When Wet",
  "Class 5.1 - Oxidising Agent",
  "Class 5.2 - Organic Peroxide",
  "Class 6.1 - Toxic Substance",
  "Class 7 - Radioactive",
  "Class 8 - Corrosive",
  "Class 9 - Miscellaneous Dangerous Goods",
];
