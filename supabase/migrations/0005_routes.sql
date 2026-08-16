-- Montague: route history, stops, and flagged issues

create table routes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  created_by uuid not null references profiles (id) on delete set null,
  truck_id uuid references trucks (id) on delete set null,
  name text,

  origin_name text not null,
  origin_place_id text,
  origin_lat double precision not null,
  origin_lng double precision not null,

  destination_name text not null,
  destination_place_id text,
  destination_lat double precision not null,
  destination_lng double precision not null,

  distance_metres integer not null default 0,
  duration_seconds integer not null default 0,
  has_tolls boolean not null default false,

  -- Encoded polyline only. Do not persist the full raw provider response
  -- indefinitely; route_response_summary stores the distilled fields we
  -- actually use, in line with routing API storage terms.
  encoded_polyline text not null default '',

  validation_status route_validation_status not null default 'unknown',
  checked_restriction_count integer not null default 0,

  truck_snapshot jsonb not null default '{}'::jsonb,
  route_request jsonb not null default '{}'::jsonb,
  route_response_summary jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index routes_company_id_idx on routes (company_id);
create index routes_created_by_idx on routes (created_by);
create index routes_truck_id_idx on routes (truck_id);
create index routes_created_at_idx on routes (created_at desc);

create trigger routes_set_updated_at
  before update on routes
  for each row execute function set_updated_at();

create table route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  sequence integer not null,
  name text not null,
  place_id text,
  latitude double precision not null,
  longitude double precision not null,
  stop_type stop_type not null default 'waypoint',
  created_at timestamptz not null default now()
);

create index route_stops_route_id_idx on route_stops (route_id);

create table route_issues (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  restriction_id uuid references road_restrictions (id) on delete set null,
  severity issue_severity not null,
  issue_type restriction_type not null,
  title text not null,
  description text not null,
  truck_value numeric,
  restriction_value numeric,
  unit text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create index route_issues_route_id_idx on route_issues (route_id);
create index route_issues_restriction_id_idx on route_issues (restriction_id);
