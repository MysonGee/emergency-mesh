insert into public.unit_sharing_policies (owning_unit_id, receiving_unit_id, share_capability_summary, share_loanable_assets, share_member_details_after_approval) values
  ('harbour', 'ridge', true, true, true),
  ('harbour', 'valley', true, true, true),
  ('ridge', 'harbour', true, true, true),
  ('valley', 'harbour', true, true, true);

insert into public.preparedness_plans (owning_unit_id, title, version, status, owner_label, last_reviewed_at, next_review_at, dependencies) values
  ('harbour', 'Harbour Flood Preparedness Plan', '1.4', 'REVIEW_REQUIRED', 'Preparedness Lead', '2026-07-15T00:00:00Z', '2026-10-15T00:00:00Z', '[{"type":"community_resource_site","id":"ALBION_PARK_01","assumption":"Site is open and stocked"}]');

insert into public.community_resource_sites (id, owning_unit_id, name, resource_type, status, public_status, location_label, operating_hours, stock_capacity, estimated_stock, restock_threshold_percent, last_verified_at, public_instructions) values
  ('ALBION_PARK_01', 'harbour', 'Albion Park Community Sandbag Point', 'SANDBAGS', 'LOW_STOCK', 'OPEN', 'Albion Park Depot', '08:00–20:00', 1200, 180, 25, '2026-08-27T16:42:00Z', 'Bring suitable containers and follow volunteer directions. Stock information is indicative.');

insert into public.resource_site_signals (site_id, source, reported_level_percent, confidence, note, is_authoritative, created_at) values
  ('ALBION_PARK_01', 'STAFF_UPDATE', 15, 0.95, 'Manual stock count: approximately 180 bags remaining.', true, '2026-08-27T16:42:00Z'),
  ('ALBION_PARK_01', 'COMMUNITY_REPORT', 12, 0.45, 'Empty bags are getting low.', false, '2026-08-27T16:48:00Z');
