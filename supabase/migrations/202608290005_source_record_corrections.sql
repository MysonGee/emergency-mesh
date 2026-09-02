-- A controlled correction layer for the fictional source feeds.
-- It preserves the upstream extract and records demo changes separately.
create table public.source_record_corrections (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.data_sources(id) on delete cascade,
  record_key text not null,
  record_label text not null,
  evidence_label text not null,
  status_label text not null,
  is_added boolean not null default false,
  amended_by uuid references auth.users(id),
  amended_at timestamptz not null default now(),
  unique (source_id, record_key)
);

alter table public.source_record_corrections enable row level security;

create policy "fictional source corrections readable" on public.source_record_corrections
  for select using (true);

create policy "authenticated demo users may amend source corrections" on public.source_record_corrections
  for insert to authenticated with check (true);

create policy "authenticated demo users may update source corrections" on public.source_record_corrections
  for update to authenticated using (true) with check (true);
