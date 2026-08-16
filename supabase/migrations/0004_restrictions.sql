-- Montague: road restriction dataset + source/import tracking

create table data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  jurisdiction text not null,
  source_type text not null,
  source_url text,
  licence text,
  update_frequency text,
  last_import_at timestamptz,
  last_success_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table road_restrictions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null default 'AU',
  state_code text,
  restriction_type restriction_type not null,
  name text not null,
  road_name text,
  description text,

  latitude double precision not null,
  longitude double precision not null,
  geom geography(Point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) stored,

  max_height_mm integer,
  max_width_mm integer,
  max_length_mm integer,
  max_weight_kg integer,
  max_axles integer,

  allowed_vehicle_classes text[],
  restricted_vehicle_classes text[],
  restricted_hazardous_goods text[],

  direction route_direction not null default 'both',
  permit_required boolean not null default false,

  effective_from timestamptz,
  effective_until timestamptz,
  curfew_description text,

  source_name text not null,
  source_url text,
  source_reference text,
  data_source_id uuid references data_sources (id) on delete set null,

  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_development_data boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index road_restrictions_geom_idx on road_restrictions using gist (geom);
create index road_restrictions_state_idx on road_restrictions (state_code);
create index road_restrictions_type_idx on road_restrictions (restriction_type);
create index road_restrictions_verification_idx on road_restrictions (verification_status);

create trigger road_restrictions_set_updated_at
  before update on road_restrictions
  for each row execute function set_updated_at();

create table data_import_jobs (
  id uuid primary key default gen_random_uuid(),
  data_source_id uuid not null references data_sources (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status import_job_status not null default 'pending',
  records_received integer not null default 0,
  records_created integer not null default 0,
  records_updated integer not null default 0,
  records_failed integer not null default 0,
  error_message text
);

create index data_import_jobs_source_idx on data_import_jobs (data_source_id);
