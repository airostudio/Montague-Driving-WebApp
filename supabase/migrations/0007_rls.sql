-- Montague: Row Level Security. Every user/company-scoped table is locked
-- down by default; access is granted only through explicit policies driven
-- by the caller's profile (never by client-supplied ids).

alter table companies enable row level security;
alter table profiles enable row level security;
alter table company_members enable row level security;
alter table trucks enable row level security;
alter table trailers enable row level security;
alter table saved_locations enable row level security;
alter table routes enable row level security;
alter table route_stops enable row level security;
alter table route_issues enable row level security;
alter table road_restrictions enable row level security;
alter table data_sources enable row level security;
alter table data_import_jobs enable row level security;
alter table audit_events enable row level security;

-- companies -----------------------------------------------------------

create policy companies_select on companies
  for select using (
    id = current_company_id() or is_platform_admin()
  );

create policy companies_insert on companies
  for insert with check (true); -- any authenticated user may create a company (onboarding)

create policy companies_update on companies
  for update using (
    id = current_company_id() and has_company_management_role()
  );

-- profiles --------------------------------------------------------------

create policy profiles_select on profiles
  for select using (
    auth_user_id = auth.uid()
    or company_id = current_company_id()
    or is_platform_admin()
  );

create policy profiles_insert_self on profiles
  for insert with check (auth_user_id = auth.uid());

create policy profiles_update on profiles
  for update using (
    auth_user_id = auth.uid()
    or (company_id = current_company_id() and has_company_management_role())
  );

-- company_members ---------------------------------------------------------

create policy company_members_select on company_members
  for select using (
    company_id = current_company_id() or user_id = auth.uid() or is_platform_admin()
  );

create policy company_members_insert on company_members
  for insert with check (
    company_id = current_company_id() and has_company_management_role()
  );

create policy company_members_update on company_members
  for update using (
    company_id = current_company_id() and has_company_management_role()
  );

create policy company_members_delete on company_members
  for delete using (
    company_id = current_company_id() and has_company_management_role()
  );

-- trucks ------------------------------------------------------------------

create policy trucks_select on trucks
  for select using (company_id = current_company_id() or is_platform_admin());

create policy trucks_insert on trucks
  for insert with check (
    company_id = current_company_id()
    and current_role() in ('fleet_manager', 'company_admin', 'platform_admin')
  );

create policy trucks_update on trucks
  for update using (
    company_id = current_company_id()
    and current_role() in ('fleet_manager', 'company_admin', 'platform_admin')
  );

create policy trucks_delete on trucks
  for delete using (
    company_id = current_company_id()
    and current_role() in ('fleet_manager', 'company_admin', 'platform_admin')
  );

-- trailers ------------------------------------------------------------------

create policy trailers_select on trailers
  for select using (company_id = current_company_id() or is_platform_admin());

create policy trailers_insert on trailers
  for insert with check (
    company_id = current_company_id()
    and current_role() in ('fleet_manager', 'company_admin', 'platform_admin')
  );

create policy trailers_update on trailers
  for update using (
    company_id = current_company_id()
    and current_role() in ('fleet_manager', 'company_admin', 'platform_admin')
  );

create policy trailers_delete on trailers
  for delete using (
    company_id = current_company_id()
    and current_role() in ('fleet_manager', 'company_admin', 'platform_admin')
  );

-- saved_locations -----------------------------------------------------------

create policy saved_locations_select on saved_locations
  for select using (company_id = current_company_id() or is_platform_admin());

create policy saved_locations_insert on saved_locations
  for insert with check (company_id = current_company_id());

create policy saved_locations_update on saved_locations
  for update using (company_id = current_company_id());

create policy saved_locations_delete on saved_locations
  for delete using (
    company_id = current_company_id()
    and current_role() in ('dispatcher', 'fleet_manager', 'company_admin', 'platform_admin')
  );

-- routes ----------------------------------------------------------------

create policy routes_select on routes
  for select using (company_id = current_company_id() or is_platform_admin());

create policy routes_insert on routes
  for insert with check (company_id = current_company_id());

create policy routes_update on routes
  for update using (company_id = current_company_id());

create policy routes_delete on routes
  for delete using (
    company_id = current_company_id()
    and current_role() in ('dispatcher', 'fleet_manager', 'company_admin', 'platform_admin')
  );

-- route_stops / route_issues follow their parent route ----------------------

create policy route_stops_select on route_stops
  for select using (
    exists (
      select 1 from routes r
      where r.id = route_stops.route_id
        and (r.company_id = current_company_id() or is_platform_admin())
    )
  );

create policy route_stops_insert on route_stops
  for insert with check (
    exists (
      select 1 from routes r
      where r.id = route_stops.route_id and r.company_id = current_company_id()
    )
  );

create policy route_stops_delete on route_stops
  for delete using (
    exists (
      select 1 from routes r
      where r.id = route_stops.route_id and r.company_id = current_company_id()
    )
  );

create policy route_issues_select on route_issues
  for select using (
    exists (
      select 1 from routes r
      where r.id = route_issues.route_id
        and (r.company_id = current_company_id() or is_platform_admin())
    )
  );

create policy route_issues_insert on route_issues
  for insert with check (
    exists (
      select 1 from routes r
      where r.id = route_issues.route_id and r.company_id = current_company_id()
    )
  );

-- road_restrictions ---------------------------------------------------------
-- Public dataset: any authenticated user can read. Only platform admins
-- (or the service role used by import jobs) may write.

create policy road_restrictions_select on road_restrictions
  for select using (auth.role() = 'authenticated');

create policy road_restrictions_insert on road_restrictions
  for insert with check (is_platform_admin());

create policy road_restrictions_update on road_restrictions
  for update using (is_platform_admin());

create policy road_restrictions_delete on road_restrictions
  for delete using (is_platform_admin());

-- data_sources / data_import_jobs: platform admin only ----------------------

create policy data_sources_select on data_sources
  for select using (is_platform_admin());

create policy data_sources_write on data_sources
  for all using (is_platform_admin()) with check (is_platform_admin());

create policy data_import_jobs_select on data_import_jobs
  for select using (is_platform_admin());

create policy data_import_jobs_write on data_import_jobs
  for all using (is_platform_admin()) with check (is_platform_admin());

-- audit_events ----------------------------------------------------------

create policy audit_events_select on audit_events
  for select using (company_id = current_company_id() or is_platform_admin());

create policy audit_events_insert on audit_events
  for insert with check (company_id = current_company_id() or is_platform_admin());
