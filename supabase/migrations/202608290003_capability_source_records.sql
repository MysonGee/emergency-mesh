-- Read-only upstream-source model for the fictional competition environment.
-- These records inform capability assessments; they are not an operational system of record.

create type public.source_health as enum ('CONNECTED', 'STALE', 'REVIEW_REQUIRED', 'DISABLED');
create type public.evidence_status as enum ('CURRENT', 'DUE_SOON', 'OVERDUE', 'REVIEW_REQUIRED');

create table public.data_sources (
  id text primary key,
  display_name text not null,
  description text not null,
  health public.source_health not null default 'CONNECTED',
  last_refreshed_at timestamptz,
  record_count integer not null default 0 check (record_count >= 0),
  created_at timestamptz not null default now()
);

create table public.member_availability_evidence (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references public.members(id) on delete cascade,
  source_id text not null references public.data_sources(id),
  available_from timestamptz not null,
  available_until timestamptz not null check (available_until > available_from),
  declared_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.member_currency_evidence (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references public.members(id) on delete cascade,
  competency_code text not null,
  source_id text not null references public.data_sources(id),
  last_verified_at timestamptz,
  expires_at timestamptz,
  status public.evidence_status not null,
  created_at timestamptz not null default now()
);

create table public.asset_maintenance_evidence (
  id uuid primary key default gen_random_uuid(),
  asset_id text not null references public.assets(id) on delete cascade,
  source_id text not null references public.data_sources(id),
  check_type text not null,
  last_completed_at timestamptz,
  next_due_at timestamptz,
  cycle_label text not null,
  status public.evidence_status not null,
  capability_impact text not null,
  created_at timestamptz not null default now()
);

create table public.safety_compliance_evidence (
  id uuid primary key default gen_random_uuid(),
  owning_unit_id text not null references public.units(id),
  source_id text not null references public.data_sources(id),
  category text not null,
  item_name text not null,
  location_label text not null,
  last_completed_at timestamptz,
  next_due_at timestamptz,
  cycle_label text,
  status public.evidence_status not null,
  created_at timestamptz not null default now()
);

create view public.source_data_catalogue as
select id, display_name, description, health, last_refreshed_at, record_count from public.data_sources;

alter table public.data_sources enable row level security;
alter table public.member_availability_evidence enable row level security;
alter table public.member_currency_evidence enable row level security;
alter table public.asset_maintenance_evidence enable row level security;
alter table public.safety_compliance_evidence enable row level security;

create policy "fictional source catalogue readable" on public.data_sources for select using (true);
create policy "fictional availability evidence readable" on public.member_availability_evidence for select using (true);
create policy "fictional currency evidence readable" on public.member_currency_evidence for select using (true);
create policy "fictional maintenance evidence readable" on public.asset_maintenance_evidence for select using (true);
create policy "fictional compliance evidence readable" on public.safety_compliance_evidence for select using (true);
