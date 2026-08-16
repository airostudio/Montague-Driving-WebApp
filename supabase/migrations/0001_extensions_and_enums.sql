-- Montague: extensions and shared enum types

create extension if not exists "pgcrypto";
create extension if not exists "postgis";

create type user_role as enum (
  'driver',
  'dispatcher',
  'fleet_manager',
  'company_admin',
  'platform_admin'
);

create type vehicle_type as enum (
  'rigid',
  'prime_mover',
  'semi_trailer',
  'b_double',
  'b_triple',
  'road_train',
  'pbs',
  'other'
);

create type restriction_type as enum (
  'height',
  'width',
  'length',
  'weight',
  'axle',
  'bridge',
  'tunnel',
  'road_access',
  'vehicle_class',
  'hazardous_goods',
  'curfew',
  'closure',
  'permit_required',
  'road_condition',
  'other'
);

create type verification_status as enum (
  'verified',
  'unverified',
  'expired',
  'needs_review'
);

create type route_validation_status as enum (
  'clear',
  'warning',
  'restricted',
  'unknown'
);

create type issue_severity as enum (
  'info',
  'warning',
  'critical'
);

create type route_direction as enum (
  'both',
  'northbound',
  'southbound',
  'eastbound',
  'westbound'
);

create type stop_type as enum (
  'waypoint',
  'depot',
  'delivery',
  'rest'
);

create type import_job_status as enum (
  'pending',
  'running',
  'succeeded',
  'failed'
);

-- Shared trigger to keep updated_at current on every row update.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
