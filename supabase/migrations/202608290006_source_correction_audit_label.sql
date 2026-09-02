-- Keeps corrections reviewable without exposing an authentication identifier in the UI.
alter table public.source_record_corrections
  add column amended_by_label text;
