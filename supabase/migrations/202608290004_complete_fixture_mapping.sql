-- Fields required to map the complete Emergency Mesh demonstration fixture.
alter table public.members
  add column if not exists source_status text not null default 'ONLINE',
  add column if not exists maximum_continuous_hours integer not null default 14,
  add column if not exists activity_hours_before_window numeric not null default 0,
  add column if not exists experience_years integer,
  add column if not exists training_summary text;

alter table public.assets
  add column if not exists capacity_label text,
  add column if not exists source_condition text;

create index if not exists member_availability_member_window_idx
  on public.member_availability_evidence (member_id, available_from, available_until);
create index if not exists asset_maintenance_asset_due_idx
  on public.asset_maintenance_evidence (asset_id, next_due_at);
