-- Montague: trucks, trailers, saved locations

create table trucks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  registration text,
  vehicle_type vehicle_type not null default 'semi_trailer',
  height_mm integer not null check (height_mm > 0 and height_mm <= 10000),
  width_mm integer not null check (width_mm > 0 and width_mm <= 6000),
  length_mm integer not null check (length_mm > 0 and length_mm <= 60000),
  actual_weight_kg integer not null check (actual_weight_kg > 0 and actual_weight_kg <= 200000),
  axle_count integer not null check (axle_count > 0 and axle_count <= 20),
  trailer_count integer not null default 0 check (trailer_count >= 0 and trailer_count <= 4),
  hazardous_goods_types text[] not null default '{}',
  custom_height_safety_margin_mm integer check (custom_height_safety_margin_mm >= 0),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trucks_company_id_idx on trucks (company_id);

create trigger trucks_set_updated_at
  before update on trucks
  for each row execute function set_updated_at();

create table trailers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  registration text,
  height_mm integer not null check (height_mm > 0 and height_mm <= 10000),
  width_mm integer not null check (width_mm > 0 and width_mm <= 6000),
  length_mm integer not null check (length_mm > 0 and length_mm <= 30000),
  weight_kg integer not null check (weight_kg > 0 and weight_kg <= 100000),
  axle_count integer not null check (axle_count > 0 and axle_count <= 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trailers_company_id_idx on trailers (company_id);

create trigger trailers_set_updated_at
  before update on trailers
  for each row execute function set_updated_at();

create table saved_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  formatted_address text not null,
  place_id text,
  latitude double precision not null,
  longitude double precision not null,
  notes text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_locations_company_id_idx on saved_locations (company_id);

create trigger saved_locations_set_updated_at
  before update on saved_locations
  for each row execute function set_updated_at();
