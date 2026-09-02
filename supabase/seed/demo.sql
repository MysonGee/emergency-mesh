insert into public.units (id, name, minimum_readiness) values
  ('harbour', 'Unit Harbour', 1),
  ('ridge', 'Unit Ridge', 2),
  ('valley', 'Unit Valley', 1);

insert into public.members (id, unit_id, display_name) values
  ('H01', 'harbour', 'Morgan Lee'), ('H02', 'harbour', 'Taylor Finch'),
  ('H03', 'harbour', 'Casey Rowan'), ('H04', 'harbour', 'Riley Santos'),
  ('H05', 'harbour', 'Parker Quinn'), ('H06', 'harbour', 'Drew Ellis'),
  ('H07', 'harbour', 'Avery Cole'), ('H08', 'harbour', 'Jules Ray'),
  ('H09', 'harbour', 'Emery Blake'), ('H10', 'harbour', 'Skyler Moss'),
  ('H11', 'harbour', 'Alex Monroe'), ('H12', 'harbour', 'Sage Hart'),
  ('H13', 'harbour', 'Robin Hale'), ('H14', 'harbour', 'Cameron Shore'),
  ('R01', 'ridge', 'Reese Lane'), ('R02M', 'ridge', 'Hayden Park'),
  ('V04', 'valley', 'Jordan Vale');

insert into public.member_competencies (member_id, code) values
  ('H01', 'FLOOD_RESCUE'), ('H02', 'FLOOD_RESCUE'), ('H03', 'CHAINSAW'),
  ('H04', 'CHAINSAW'), ('H07', 'FLOOD_RESCUE'), ('H07', 'CHAINSAW'),
  ('H07', 'SPECIALIST_DRIVER'), ('V04', 'SPECIALIST_DRIVER'),
  ('R01', 'SPECIALIST_DRIVER'), ('R02M', 'FLOOD_RESCUE');

insert into public.assets (id, owning_unit_id, name, asset_type, status, offline_until, remaining_usage_hours) values
  ('H-S01', 'harbour', 'Harbour Specialist 01', 'SPECIALIST_TRUCK', 'OFFLINE_UNTIL', '2026-09-05T00:00:00Z', null),
  ('H-G03', 'harbour', 'Generator G03', 'GENERATOR', 'AVAILABLE', null, 5.4),
  ('R02', 'ridge', 'Ridge Specialist 02', 'SPECIALIST_TRUCK', 'AVAILABLE', null, null),
  ('R03', 'ridge', 'Ridge Specialist 03', 'SPECIALIST_TRUCK', 'OFFLINE_UNTIL', '2026-09-05T00:00:00Z', null);
