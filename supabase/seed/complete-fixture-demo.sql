-- Complete fictional Harbour fixture: 100 Harbour members and all fleet/equipment.
-- Run after demo.sql and capability-source-demo.sql. Re-runnable via upserts.
insert into public.units (id, name, minimum_readiness) values
  ('harbour', 'Unit Harbour', 1), ('ridge', 'Unit Ridge', 1), ('valley', 'Unit Valley', 1)
on conflict (id) do update set name = excluded.name, minimum_readiness = excluded.minimum_readiness;

insert into public.members (id, unit_id, display_name, source_status, maximum_continuous_hours, activity_hours_before_window, experience_years, training_summary) values
 ('H01','harbour','Morgan Lee','ONLINE',14,0,4,'Imported qualification record'),('H02','harbour','Taylor Finch','ONLINE',14,0,4,'Imported qualification record'),('H03','harbour','Casey Rowan','ONLINE',14,0,4,'Imported qualification record'),('H04','harbour','Riley Santos','IN_USE',14,0,4,'Imported qualification record'),('H05','harbour','Parker Quinn','ONLINE',14,0,4,'Imported qualification record'),('H06','harbour','Drew Ellis','ONLINE',14,0,4,'Imported qualification record'),('H07','harbour','Avery Cole','ONLINE',14,0,4,'Imported qualification record'),('H08','harbour','Jules Ray','ONLINE',14,4,4,'Imported qualification record'),('H09','harbour','Emery Blake','ONLINE',14,0,4,'Imported qualification record'),('H10','harbour','Skyler Moss','ONLINE',14,0,4,'Imported qualification record'),('H11','harbour','Alex Monroe','ONLINE',14,0,4,'Imported qualification record'),('H12','harbour','Sage Hart','ONLINE',14,0,4,'Imported qualification record'),('H13','harbour','Robin Hale','ONLINE',14,0,4,'Imported qualification record'),('H14','harbour','Cameron Shore','ONLINE',14,0,4,'Imported qualification record'),('R01','ridge','Reese Lane','ONLINE',14,0,4,'Imported qualification record'),('V04','valley','Jordan Vale','ONLINE',14,0,4,'Imported qualification record')
on conflict (id) do update set display_name=excluded.display_name, source_status=excluded.source_status, activity_hours_before_window=excluded.activity_hours_before_window, training_summary=excluded.training_summary;

with names as (
  select array['Ainsley','Bailey','Blake','Charlie','Dakota','Eden','Flynn','Greer','Harper','Indigo','Jamie','Kai','Lennox','Micah','Noah','Oakley','Peyton','Quinn','Reese','Shiloh','Teagan','Vale','Wren','Xavier','Yasmin','Zion','Arden','Briar','Cleo','Devon','Ellis','Frankie','Gale','Hollis','Ira','Jesse','Keegan','Lane','Marley','Nico','Onyx','Presley','Remy'] as first_names,
         array['Archer','Bennett','Carter','Dawson','Ellery','Foster','Grady','Hughes','Irving','Jordan','Keats','Lennon','Marlow','North','Orton','Perry','Quade','Rivers','Sutton','Tanner','Ulrich','Vance','Walsh','York','Zeller','Ashby','Brooks','Cullen','Denton','Eames','Farrow','Gibson','Huxley','Ingram','Jarvis','Kendall','Larkin','Mercer','Nolan','Osborne','Parker','Quill','Reeve'] as last_names
)
insert into public.members (id, unit_id, display_name, source_status, maximum_continuous_hours, activity_hours_before_window, experience_years, training_summary)
select 'H' || lpad(i::text,2,'0'), 'harbour', first_names[((i-15)%43)+1] || ' ' || last_names[((i-15)%43)+1], case when i%29=0 then 'OFFLINE' when i%17=0 then 'IN_USE' else 'ONLINE' end, 14, case when i%19=0 then 6 else 0 end, 1+(i%18), case when i%23=0 then 'Currency lapsed in source record' when i%9=0 then 'Currency review required' else 'Current source record' end
from generate_series(15,100) i cross join names
on conflict (id) do update set display_name=excluded.display_name, source_status=excluded.source_status, activity_hours_before_window=excluded.activity_hours_before_window, experience_years=excluded.experience_years, training_summary=excluded.training_summary;

insert into public.member_competencies (member_id, code, valid_from, expires_at)
values ('H01','FLOOD_RESCUE','2026-01-01',null),('H02','FLOOD_RESCUE','2026-01-01',null),('H03','CHAINSAW','2026-01-01',null),('H04','CHAINSAW','2026-01-01',null),('H05','STORM_RESPONSE','2026-01-01',null),('H06','STORM_RESPONSE','2026-01-01',null),('H07','FLOOD_RESCUE','2026-01-01',null),('H07','CHAINSAW','2026-01-01',null),('H07','SPECIALIST_DRIVER','2026-01-01',null),('H08','SPECIALIST_DRIVER','2026-01-01',null),('R01','SPECIALIST_DRIVER','2026-01-01',null),('V04','SPECIALIST_DRIVER','2026-01-01',null)
on conflict (member_id, code) do nothing;

insert into public.member_competencies (member_id, code, valid_from)
select 'H'||lpad(i::text,2,'0'), code, '2026-01-01' from generate_series(15,100) i cross join lateral unnest(array[case when i%2=0 then 'STORM_RESPONSE' else 'FLOOD_RESCUE' end, case when i%3=0 then 'CHAINSAW' else 'FIRST_AID' end, case when i%4=0 then 'BOAT_OPERATOR' end, case when i%7=0 then 'DRONE_OPERATOR' end, case when i%8=0 then 'RADIO_OPERATOR' end, case when i%10=0 then 'IMT' end, case when i%11=0 then 'SPECIALIST_DRIVER' end, case when i%13=0 then 'LOGISTICS' end]) code where code is not null
on conflict (member_id, code) do nothing;

insert into public.member_availability_evidence (member_id, source_id, available_from, available_until, declared_at)
select id, 'availability', '2026-08-27T00:00:00Z', '2026-08-29T00:00:00Z', '2026-08-27T09:12:00Z' from public.members where id ~ '^(H|R|V)';

insert into public.assets (id, owning_unit_id, name, asset_type, status, offline_until, remaining_usage_hours, capacity_label, source_condition) values
 ('H-S01','harbour','Harbour Specialist 01','SPECIALIST_TRUCK','OFFLINE_UNTIL','2026-09-05',null,'Specialist capability platform','REVIEW_REQUIRED'),('H-ST01','harbour','Harbour Storm 01','STORM_TRUCK','AVAILABLE',null,null,'Light storm response · 3 people',null),('H-ST02','harbour','Harbour Storm 02','STORM_TRUCK','AVAILABLE',null,null,'Medium storm response · 5 people',null),('H-ST03','harbour','Harbour Storm 03','STORM_TRUCK','IN_USE',null,null,'Medium storm response · 5 people',null),('H-ST04','harbour','Harbour Storm 04','STORM_TRUCK','AVAILABLE',null,null,'Heavy storm response · 6 people',null),('H-ST05','harbour','Harbour Storm 05','STORM_TRUCK','MAINTENANCE_DUE',null,null,'Heavy storm response · 6 people','REVIEW_REQUIRED'),('H-ST06','harbour','Harbour Storm 06','STORM_TRUCK','AVAILABLE',null,null,'Light storm response · 3 people',null),('H-RV01','harbour','Harbour Rescue 01','RESCUE_VEHICLE','AVAILABLE',null,null,'Rescue vehicle · 4 people',null),('H-RV02','harbour','Harbour Rescue 02','RESCUE_VEHICLE','AVAILABLE',null,null,'Rescue vehicle · 4 people',null),('H-RV03','harbour','Harbour Rescue 03','RESCUE_VEHICLE','IN_USE',null,null,'Rescue vehicle · 5 people',null),('H-RV04','harbour','Harbour Rescue 04','RESCUE_VEHICLE','AVAILABLE',null,null,'Rescue vehicle · 5 people',null),('H-RV05','harbour','Harbour Rescue 05','RESCUE_VEHICLE','AVAILABLE',null,null,'Rescue vehicle · 4 people',null),('H-FB01','harbour','Harbour RIB 01','FLOOD_BOAT','AVAILABLE',null,null,'Rigid inflatable boat · 4 people',null),('H-FB02','harbour','Harbour RIB 02','FLOOD_BOAT','AVAILABLE',null,null,'Rigid inflatable boat · 6 people',null),('H-FB03','harbour','Harbour Bow Loader 01','FLOOD_BOAT','AVAILABLE',null,null,'Bow-loader flood boat · 8 people',null),('H-FB04','harbour','Harbour Flat Bottom 01','FLOOD_BOAT','MAINTENANCE_DUE',null,null,'Flat-bottom flood boat · 5 people','REVIEW_REQUIRED'),('H-FB05','harbour','Harbour Rescue Craft 01','FLOOD_BOAT','AVAILABLE',null,null,'Shallow-water rescue craft · 3 people',null),('H-G01','harbour','Generator G01','GENERATOR','AVAILABLE',null,null,'20 kVA',null),('H-G02','harbour','Generator G02','GENERATOR','AVAILABLE',null,null,'40 kVA',null),('H-G03','harbour','Generator G03','GENERATOR','IN_USE',null,5.4,'10 kVA',null),('H-FCV01','harbour','Harbour Forward Command 01','FORWARD_COMMAND_VEHICLE','AVAILABLE',null,null,'Forward command workspace · 4 staff',null),('H-DR01','harbour','Drone 01','DRONE','AVAILABLE',null,null,'Thermal imaging · 35 min endurance',null),('H-DR02','harbour','Drone 02','DRONE','AVAILABLE',null,null,'Visual mapping · 42 min endurance',null),('H-DR03','harbour','Drone 03','DRONE','IN_USE',null,null,'Thermal imaging · 28 min endurance',null),('H-RC01','harbour','Radio Cache 01','RADIO_CACHE','AVAILABLE',null,null,'24 handheld radios',null),('H-RC02','harbour','Radio Cache 02','RADIO_CACHE','AVAILABLE',null,null,'12 handheld radios',null),('H-GPV01','harbour','Harbour General Purpose 01','GENERAL_PURPOSE_VEHICLE','AVAILABLE',null,null,'General purpose · 5 people',null),('H-CU01','harbour','Harbour Commander Ute 01','COMMANDER_UTE','AVAILABLE',null,null,'Command support · 2 people',null),('H-GZ01','harbour','Gazebo 01','GAZEBO','AVAILABLE',null,null,'3 × 3 m shelter',null),('H-GZ02','harbour','Gazebo 02','GAZEBO','AVAILABLE',null,null,'3 × 3 m shelter',null),('H-GZ03','harbour','Gazebo 03','GAZEBO','AVAILABLE',null,null,'6 × 3 m shelter',null),('H-C01','harbour','Chainsaw C01','CHAINSAW','AVAILABLE',null,20,'Source maintenance horizon: 20 hours',null),('R02','ridge','Ridge Specialist 02','SPECIALIST_TRUCK','AVAILABLE',null,null,null,null),('R01','ridge','Ridge Specialist 01','SPECIALIST_TRUCK','AVAILABLE',null,null,null,null),('R03','ridge','Ridge Specialist 03','SPECIALIST_TRUCK','OFFLINE_UNTIL','2026-09-05',null,null,null)
on conflict (id) do update set owning_unit_id=excluded.owning_unit_id,name=excluded.name,asset_type=excluded.asset_type,status=excluded.status,offline_until=excluded.offline_until,remaining_usage_hours=excluded.remaining_usage_hours,capacity_label=excluded.capacity_label,source_condition=excluded.source_condition;

-- Fictional issue evidence used by the availability-horizon and fleet demonstrations.
-- It is source evidence, not live asset tracking.
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

-- Staggered fictional declarations make each 12–72 hour availability horizon distinct.
update public.member_availability_evidence
set available_until = case
  when member_id ~ '^H' and substring(member_id from 2)::integer % 17 = 0 then '2026-08-28T06:00:00Z'::timestamptz
  when member_id ~ '^H' and substring(member_id from 2)::integer % 13 = 0 then '2026-08-28T18:00:00Z'::timestamptz
  when member_id ~ '^H' and substring(member_id from 2)::integer % 11 = 0 then '2026-08-29T06:00:00Z'::timestamptz
  when member_id ~ '^H' and substring(member_id from 2)::integer % 7 = 0 then '2026-08-29T18:00:00Z'::timestamptz
  when member_id ~ '^H' then '2026-08-30T18:00:00Z'::timestamptz
  else available_until
end;

update public.data_sources set record_count = case id when 'membership' then 102 when 'availability' then 102 when 'training' then (select count(*) from public.member_competencies) when 'asset-register' then 36 else record_count end;
