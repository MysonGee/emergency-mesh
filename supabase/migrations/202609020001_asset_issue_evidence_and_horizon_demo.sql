-- Fictional source evidence for the competition demonstration. These fields
-- describe an asset's reported review state; they are not live tracking data.
alter table public.assets
  add column if not exists offline_since timestamptz,
  add column if not exists offline_reason text;

update public.assets
set status = 'OFFLINE_UNTIL',
    source_condition = 'REVIEW_REQUIRED',
    offline_since = case id
      when 'H-S01' then '2026-08-27T14:20:00Z'::timestamptz
      when 'H-ST05' then '2026-08-27T09:10:00Z'::timestamptz
      when 'H-FB04' then '2026-08-27T11:45:00Z'::timestamptz
      when 'H-G03' then '2026-08-27T16:05:00Z'::timestamptz
    end,
    offline_until = case id
      when 'H-S01' then '2026-09-05T00:00:00Z'::timestamptz
      when 'H-ST05' then '2026-08-29T18:00:00Z'::timestamptz
      when 'H-FB04' then '2026-08-30T06:00:00Z'::timestamptz
      when 'H-G03' then '2026-08-28T18:00:00Z'::timestamptz
    end,
    offline_reason = case id
      when 'H-S01' then 'Drivetrain fault under workshop repair; replacement part is awaited.'
      when 'H-ST05' then 'Brake inspection identified a hydraulic leak; workshop clearance is pending.'
      when 'H-FB04' then 'Hull fitting inspection requires resealing and a water-test sign-off.'
      when 'H-G03' then 'Service-hours threshold reached; scheduled preventative service is in progress.'
    end,
    remaining_usage_hours = case when id = 'H-G03' then 0 else remaining_usage_hours end
where id in ('H-S01', 'H-ST05', 'H-FB04', 'H-G03');

-- Staggered declared availability makes the 12–72 hour horizon meaningful.
update public.member_availability_evidence
set available_until = case
  when member_id ~ '^H' and substring(member_id from 2)::integer % 17 = 0 then '2026-08-28T06:00:00Z'::timestamptz
  when member_id ~ '^H' and substring(member_id from 2)::integer % 13 = 0 then '2026-08-28T18:00:00Z'::timestamptz
  when member_id ~ '^H' and substring(member_id from 2)::integer % 11 = 0 then '2026-08-29T06:00:00Z'::timestamptz
  when member_id ~ '^H' and substring(member_id from 2)::integer % 7 = 0 then '2026-08-29T18:00:00Z'::timestamptz
  when member_id ~ '^H' then '2026-08-30T18:00:00Z'::timestamptz
  else available_until
end;
