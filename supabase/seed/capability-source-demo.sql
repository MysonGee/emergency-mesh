-- Fictional extracts standing in for upstream applications in the competition demo.
insert into public.data_sources (id, display_name, description, health, last_refreshed_at, record_count) values
  ('membership', 'Membership records', 'Membership identity and station association.', 'CONNECTED', '2026-08-29T09:10:00Z', 100),
  ('availability', 'Availability system', 'Declared member availability.', 'CONNECTED', '2026-08-29T09:12:00Z', 77),
  ('training', 'Member training and currency', 'Operator and qualification evidence.', 'REVIEW_REQUIRED', '2026-08-29T09:08:00Z', 214),
  ('asset-register', 'Asset register', 'Asset identity, ownership and capacity.', 'CONNECTED', '2026-08-29T09:06:00Z', 32),
  ('fleet', 'Fleet management system', 'Fleet status and maintenance cycles.', 'REVIEW_REQUIRED', '2026-08-29T09:11:00Z', 20),
  ('asset-checks', 'Asset readiness checks', 'Inspection, service and registration evidence.', 'REVIEW_REQUIRED', '2026-08-29T09:09:00Z', 42),
  ('safety', 'Safety and compliance systems', 'Safety, inspection and expiry evidence.', 'REVIEW_REQUIRED', '2026-08-29T09:07:00Z', 31),
  ('oms', 'Operational management system / CAD', 'Requirement and broad operational context.', 'CONNECTED', '2026-08-29T09:13:00Z', 4);

insert into public.member_availability_evidence (member_id, source_id, available_from, available_until, declared_at) values
  ('H01', 'availability', '2026-08-29T18:00:00Z', '2026-08-30T06:00:00Z', '2026-08-29T08:51:00Z'),
  ('H02', 'availability', '2026-08-29T18:00:00Z', '2026-08-30T06:00:00Z', '2026-08-29T08:54:00Z'),
  ('H07', 'availability', '2026-08-29T18:00:00Z', '2026-08-30T06:00:00Z', '2026-08-29T08:47:00Z');

insert into public.member_currency_evidence (member_id, competency_code, source_id, last_verified_at, expires_at, status) values
  ('H01', 'FLOOD_RESCUE', 'training', '2026-05-11T00:00:00Z', '2027-05-11T00:00:00Z', 'CURRENT'),
  ('H07', 'SPECIALIST_DRIVER', 'training', '2025-09-02T00:00:00Z', '2026-09-02T00:00:00Z', 'DUE_SOON');

insert into public.asset_maintenance_evidence (asset_id, source_id, check_type, last_completed_at, next_due_at, cycle_label, status, capability_impact) values
  ('H-S01', 'fleet', 'Vehicle PMI', '2026-07-30T00:00:00Z', '2026-08-29T00:00:00Z', '30 days', 'OVERDUE', 'Specialist truck remains offline pending source clearance.'),
  ('H-G03', 'asset-checks', 'Operating-hour service', '2026-08-12T00:00:00Z', null, '5.4 operating hours remaining', 'DUE_SOON', 'Sustained generator capability reaches its service horizon soon.');

insert into public.safety_compliance_evidence (owning_unit_id, source_id, category, item_name, location_label, last_completed_at, next_due_at, cycle_label, status) values
  ('harbour', 'safety', 'Medical safety', 'AED pad and battery expiry', 'Harbour Station', '2025-09-01T00:00:00Z', '2026-09-01T00:00:00Z', 'Annual expiry', 'DUE_SOON'),
  ('harbour', 'safety', 'Fire safety', 'Building fire extinguishers', 'Harbour Station', '2025-09-07T00:00:00Z', '2026-09-07T00:00:00Z', 'Annual service', 'DUE_SOON'),
  ('harbour', 'safety', 'Consumables', 'First-aid kit consumables', 'Harbour fleet', '2026-03-03T00:00:00Z', '2026-09-03T00:00:00Z', 'Six-month review', 'DUE_SOON');
