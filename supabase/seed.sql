-- Montague development seed data.
-- DEVELOPMENT DATA — NOT FOR OPERATIONAL USE.
-- Restriction records below are illustrative only and are NOT sourced from
-- a verified government dataset. They exist so the route validation engine
-- has something to check against in local development.

insert into data_sources (id, name, jurisdiction, source_type, source_url, licence, update_frequency, active)
values (
  '00000000-0000-0000-0000-000000000001',
  'Montague Development Dataset',
  'VIC',
  'manual',
  null,
  'Internal development use only',
  'manual',
  true
);

insert into companies (id, name, abn, country_code, timezone, height_safety_margin_mm)
values (
  '00000000-0000-0000-0000-0000000000c1',
  'Montague Demo Transport',
  '11 222 333 444',
  'AU',
  'Australia/Melbourne',
  100
);

-- Mock restriction data around Melbourne, clearly flagged as development data.
insert into road_restrictions (
  country_code, state_code, restriction_type, name, road_name, description,
  latitude, longitude, max_height_mm, source_name, verification_status,
  is_development_data, verified_at
) values
(
  'AU', 'VIC', 'bridge', 'Montague Street Bridge', 'Montague Street',
  'Low clearance rail bridge, well known height restriction near South Melbourne.',
  -37.8288, 144.9578, 3000, 'DEVELOPMENT DATA — NOT FOR OPERATIONAL USE',
  'unverified', true, now()
),
(
  'AU', 'VIC', 'height', 'Church Street Rail Bridge', 'Church Street',
  'Rail overpass, Richmond.',
  -37.8226, 144.9948, 3600, 'DEVELOPMENT DATA — NOT FOR OPERATIONAL USE',
  'unverified', true, now()
),
(
  'AU', 'VIC', 'bridge', 'Bay Street Overpass', 'Bay Street',
  'Port Melbourne rail overpass.',
  -37.8380, 144.9350, 4100, 'DEVELOPMENT DATA — NOT FOR OPERATIONAL USE',
  'unverified', true, now()
),
(
  'AU', 'VIC', 'weight', 'Westgate Bridge Approach Load Limit', 'West Gate Freeway',
  'Illustrative mass limit for oversize combinations on the approach ramp.',
  -37.8232, 144.8899, null, 'DEVELOPMENT DATA — NOT FOR OPERATIONAL USE',
  'unverified', true, now()
),
(
  'AU', 'VIC', 'curfew', 'Bolte Bridge Curfew', 'Bolte Bridge',
  'Illustrative night curfew for hazardous goods vehicles.',
  -37.8095, 144.9410, null, 'DEVELOPMENT DATA — NOT FOR OPERATIONAL USE',
  'unverified', true, now()
),
(
  'AU', 'VIC', 'closure', 'Hoddle Street Roadworks Closure', 'Hoddle Street',
  'Illustrative temporary closure for heavy vehicles during roadworks.',
  -37.8136, 144.9917, null, 'DEVELOPMENT DATA — NOT FOR OPERATIONAL USE',
  'unverified', true, now()
);

update road_restrictions set max_weight_kg = 45000 where name = 'Westgate Bridge Approach Load Limit';
update road_restrictions set curfew_description = 'No hazardous goods vehicles 10pm-6am (illustrative only)'
  where name = 'Bolte Bridge Curfew';
update road_restrictions set effective_until = now() + interval '14 days'
  where name = 'Hoddle Street Roadworks Closure';

-- Example trucks for the demo company.
insert into trucks (
  company_id, name, registration, vehicle_type,
  height_mm, width_mm, length_mm, actual_weight_kg, axle_count,
  trailer_count, hazardous_goods_types, notes, active
) values
(
  '00000000-0000-0000-0000-0000000000c1', 'Kenworth T610', '1ABC234', 'semi_trailer',
  4300, 2500, 19000, 42500, 6,
  1, '{}', 'Standard interstate semi-trailer combination.', true
),
(
  '00000000-0000-0000-0000-0000000000c1', 'Volvo FH', '1XYZ987', 'b_double',
  4300, 2500, 26000, 62500, 9,
  2, '{}', 'B-double configured for line-haul freight.', true
);

-- Example saved locations for the demo company.
insert into saved_locations (company_id, name, formatted_address, latitude, longitude, notes)
values
(
  '00000000-0000-0000-0000-0000000000c1', 'Main Depot', '100 Footscray Road, Melbourne VIC 3003',
  -37.8103, 144.9327, 'Primary distribution depot.'
),
(
  '00000000-0000-0000-0000-0000000000c1', 'Port of Melbourne', 'Swanson Dock, Melbourne VIC 3003',
  -37.8156, 144.9203, 'Container terminal.'
);
