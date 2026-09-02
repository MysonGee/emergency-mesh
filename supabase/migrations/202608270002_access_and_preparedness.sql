-- Ownership-aware access model. Users are intentionally separate from fictional
-- members: one app user may be linked to a member, but roles govern visibility.
create type public.unit_role as enum ('UNIT_LEADERSHIP', 'TRAINING_LEAD', 'LOGISTICS_OFFICER', 'MEMBER', 'REGIONAL_COORDINATOR');
create type public.plan_status as enum ('CURRENT', 'DUE_FOR_REVIEW', 'REVIEW_REQUIRED', 'ARCHIVED');
create type public.resource_site_status as enum ('OPEN', 'LOW_STOCK', 'OUT_OF_STOCK', 'CLOSED', 'UNVERIFIED');
create type public.resource_signal_source as enum ('STAFF_UPDATE', 'VOLUNTEER_UPDATE', 'COMMUNITY_REPORT', 'DELIVERY', 'USAGE_ESTIMATE', 'CAMERA_ESTIMATE');

create table public.unit_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id text not null references public.units(id) on delete cascade,
  role public.unit_role not null,
  member_id text references public.members(id),
  created_at timestamptz not null default now(),
  primary key (user_id, unit_id, role)
);

create table public.unit_sharing_policies (
  owning_unit_id text not null references public.units(id) on delete cascade,
  receiving_unit_id text not null references public.units(id) on delete cascade,
  share_capability_summary boolean not null default true,
  share_loanable_assets boolean not null default true,
  share_member_details_after_approval boolean not null default false,
  primary key (owning_unit_id, receiving_unit_id),
  check (owning_unit_id <> receiving_unit_id)
);

create table public.preparedness_plans (
  id uuid primary key default gen_random_uuid(),
  owning_unit_id text not null references public.units(id),
  title text not null,
  version text not null,
  status public.plan_status not null default 'CURRENT',
  owner_label text not null,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  dependencies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.community_resource_sites (
  id text primary key,
  owning_unit_id text references public.units(id),
  name text not null,
  resource_type text not null default 'SANDBAGS',
  status public.resource_site_status not null default 'UNVERIFIED',
  public_status public.resource_site_status not null default 'UNVERIFIED',
  location_label text not null,
  operating_hours text,
  stock_capacity integer not null check (stock_capacity >= 0),
  estimated_stock integer not null check (estimated_stock >= 0 and estimated_stock <= stock_capacity),
  restock_threshold_percent integer not null check (restock_threshold_percent between 0 and 100),
  last_verified_at timestamptz,
  public_instructions text,
  created_at timestamptz not null default now()
);

create table public.resource_site_signals (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references public.community_resource_sites(id) on delete cascade,
  source public.resource_signal_source not null,
  reported_level_percent integer check (reported_level_percent between 0 and 100),
  confidence numeric check (confidence between 0 and 1),
  note text,
  is_authoritative boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.unit_memberships enable row level security;
alter table public.unit_sharing_policies enable row level security;
alter table public.preparedness_plans enable row level security;
alter table public.community_resource_sites enable row level security;
alter table public.resource_site_signals enable row level security;

-- Public competition demo: expose only intentionally public site information and
-- aggregate-ready plan/site records. App writes will use server-side role checks.
create policy "fictional public sites are readable" on public.community_resource_sites
  for select using (true);
create policy "fictional public signals are readable" on public.resource_site_signals
  for select using (true);
