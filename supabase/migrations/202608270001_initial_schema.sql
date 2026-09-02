-- Capability Mesh is a fictional, configurable planning demo.
create type public.asset_status as enum ('AVAILABLE', 'ALLOCATED', 'LOANED', 'IN_USE', 'MAINTENANCE_DUE', 'IN_MAINTENANCE', 'UNSERVICEABLE', 'OFFLINE_UNTIL', 'MISSING');
create type public.support_request_status as enum ('DRAFT', 'REQUESTED', 'REVIEWING', 'APPROVED', 'DECLINED', 'ALLOCATED', 'TRANSFERRED', 'IN_USE', 'RETURN_DUE', 'RETURNED', 'CLOSED');

create table public.units (
  id text primary key,
  name text not null unique,
  minimum_readiness integer not null check (minimum_readiness >= 0),
  created_at timestamptz not null default now()
);

create table public.members (
  id text primary key,
  unit_id text not null references public.units(id),
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.member_competencies (
  member_id text not null references public.members(id) on delete cascade,
  code text not null,
  valid_from timestamptz not null default now(),
  expires_at timestamptz,
  primary key (member_id, code)
);

create table public.assets (
  id text primary key,
  owning_unit_id text not null references public.units(id),
  name text not null,
  asset_type text not null,
  status public.asset_status not null default 'AVAILABLE',
  offline_until timestamptz,
  remaining_usage_hours numeric,
  created_at timestamptz not null default now()
);

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  home_unit_id text not null references public.units(id),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  constraints jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references public.scenarios(id),
  requesting_unit_id text not null references public.units(id),
  supplying_unit_id text not null references public.units(id),
  resource_id text references public.assets(id),
  requested_capability text,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  reason text not null,
  donor_impact jsonb not null default '{}'::jsonb,
  status public.support_request_status not null default 'DRAFT',
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (resource_id is not null or requested_capability is not null)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

alter table public.units enable row level security;
alter table public.members enable row level security;
alter table public.member_competencies enable row level security;
alter table public.assets enable row level security;
alter table public.scenarios enable row level security;
alter table public.support_requests enable row level security;
alter table public.audit_events enable row level security;

-- Public demo users may inspect fictional resources. Scenario and approval writes will
-- be restricted to server-side actions in a later migration.
create policy "fictional demo read access" on public.units for select using (true);
create policy "fictional demo read access" on public.members for select using (true);
create policy "fictional demo read access" on public.member_competencies for select using (true);
create policy "fictional demo read access" on public.assets for select using (true);
