-- Immutable before/after history for the correction layer.
create table public.source_correction_events (
  id uuid primary key default gen_random_uuid(),
  correction_id uuid references public.source_record_corrections(id) on delete set null,
  source_id text not null,
  record_key text not null,
  action text not null check (action in ('CREATED', 'AMENDED')),
  previous_value jsonb,
  next_value jsonb not null,
  actor_label text,
  occurred_at timestamptz not null default now()
);

alter table public.source_correction_events enable row level security;
create policy "fictional correction audit readable" on public.source_correction_events for select using (true);

create function public.record_source_correction_event() returns trigger language plpgsql security definer as $$
begin
  insert into public.source_correction_events (correction_id, source_id, record_key, action, previous_value, next_value, actor_label)
  values (
    new.id, new.source_id, new.record_key,
    case when tg_op = 'INSERT' then 'CREATED' else 'AMENDED' end,
    case when tg_op = 'UPDATE' then jsonb_build_object('record', old.record_label, 'evidence', old.evidence_label, 'status', old.status_label) else null end,
    jsonb_build_object('record', new.record_label, 'evidence', new.evidence_label, 'status', new.status_label),
    new.amended_by_label
  );
  return new;
end;
$$;

create trigger source_correction_event_audit
  after insert or update on public.source_record_corrections
  for each row execute function public.record_source_correction_event();
