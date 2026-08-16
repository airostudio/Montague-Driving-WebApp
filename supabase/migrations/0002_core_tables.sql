-- Montague: companies, profiles, company membership

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abn text,
  country_code text not null default 'AU',
  timezone text not null default 'Australia/Melbourne',
  height_safety_margin_mm integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_set_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- One row per Supabase auth user. A profile may exist without a company
-- while onboarding (e.g. before creating/joining a company).
create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  company_id uuid references companies (id) on delete set null,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  role user_role not null default 'driver',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_company_id_idx on profiles (company_id);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Explicit membership table so a user can eventually belong to more than
-- one company; profiles.company_id remains the "active" company context.
create table company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role user_role not null default 'driver',
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index company_members_user_id_idx on company_members (user_id);

-- When a new auth user signs up, create their profile automatically.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    'driver'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Helper used throughout RLS policies: the caller's profile row.
create or replace function current_profile()
returns profiles
language sql
security definer
stable
set search_path = public
as $$
  select * from profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function current_company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function current_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role from profiles where auth_user_id = auth.uid()) = 'platform_admin', false);
$$;

create or replace function has_company_management_role()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role from profiles where auth_user_id = auth.uid())
      in ('company_admin', 'platform_admin'),
    false
  );
$$;
