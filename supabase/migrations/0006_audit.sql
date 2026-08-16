-- Montague: audit trail for important activity

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_company_id_idx on audit_events (company_id);
create index audit_events_created_at_idx on audit_events (created_at desc);
