-- ============================================================================
-- CrimeLens AI — Demo Seed Data
-- File: seed_demo_data.sql
-- Description: Populates the database with realistic demo data for the MVP
--              Includes sample users, incidents, classifications, hotspots,
--              and risk scores in Bangalore, India
-- ============================================================================
-- Usage:    psql -f seed_demo_data.sql
-- Requires: migrations 001 and 002 applied
-- Rollback: TRUNCATE profiles, incidents, classifications, incident_images,
--                 hotspots, risk_scores, safe_routes CASCADE;
-- ============================================================================

-- ============================================================
-- 1. DEMO USERS (auth.users + profiles)
-- ============================================================
-- Note: In production, profiles are auto-created via the handle_new_user trigger.
-- For demo/development, we insert directly into auth.users (requires superuser)
-- and profiles.
--
-- If using Supabase SQL Editor, auth.users insert may be restricted.
-- Alternative: Use the Supabase Auth admin API or create users via sign-up.
-- For SQL-only seeding, skip auth.users and insert profiles with known UUIDs,
-- then use anonymous auth for demo.
-- ============================================================

-- Use gen_random_uuid() for stable demo UUIDs
-- These UUIDs are deterministic for reproducibility

-- Demo User 1: Regular citizen
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT
    'd0000000-0000-0000-0000-000000000001'::uuid,
    'ravi.sharma@example.com',
    '$2a$10$dummyhashedpassword1234567890abcdefghijklmnopqrstuvwxyz',  -- password: demo123
    now(),
    '{"full_name": "Ravi Sharma"}',
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'd0000000-0000-0000-0000-000000000001'::uuid);

INSERT INTO profiles (id, email, full_name, role)
SELECT
    'd0000000-0000-0000-0000-000000000001'::uuid,
    'ravi.sharma@example.com',
    'Ravi Sharma',
    'citizen'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'd0000000-0000-0000-0000-000000000001'::uuid);

-- Demo User 2: Analyst (dashboard access)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT
    'd0000000-0000-0000-0000-000000000002'::uuid,
    'priya.kumar@example.com',
    '$2a$10$dummyhashedpassword1234567890abcdefghijklmnopqrstuvwxyz',
    now(),
    '{"full_name": "Priya Kumar"}',
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'd0000000-0000-0000-0000-000000000002'::uuid);

INSERT INTO profiles (id, email, full_name, role)
SELECT
    'd0000000-0000-0000-0000-000000000002'::uuid,
    'priya.kumar@example.com',
    'Priya Kumar',
    'analyst'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'd0000000-0000-0000-0000-000000000002'::uuid);

-- Demo User 3: Admin
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT
    'd0000000-0000-0000-0000-000000000003'::uuid,
    'admin@crimelens.ai',
    '$2a$10$dummyhashedpassword1234567890abcdefghijklmnopqrstuvwxyz',
    now(),
    '{"full_name": "Admin User"}',
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'd0000000-0000-0000-0000-000000000003'::uuid);

INSERT INTO profiles (id, email, full_name, role)
SELECT
    'd0000000-0000-0000-0000-000000000003'::uuid,
    'admin@crimelens.ai',
    'Admin User',
    'admin'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'd0000000-0000-0000-0000-000000000003'::uuid);

-- ============================================================
-- 2. DEMO INCIDENTS
-- ============================================================
-- Bangalore, India coordinates:
--   City center: 12.9716, 77.5946
--   MG Road: ~12.9720, 77.5933
--   Koramangala: ~12.9352, 77.6245
--   Indiranagar: ~12.9784, 77.6408
--   Whitefield: ~12.9698, 77.7500
--   Jayanagar: ~12.9250, 77.5938
--   Malleswaram: ~12.9950, 77.5710
--   Electronic City: ~12.8399, 77.6770
-- ============================================================

-- Helper: Create incidents spread across the last 30 days
-- We'll use generate_series for demo efficiency

-- Theft cluster near MG Road (hotspot 1)
INSERT INTO incidents (id, user_id, title, description, incident_type, status, lat, lng, gps_accuracy, classification, confidence, occurred_at, created_at)
VALUES
('i0000001-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Phone snatched near MG Road metro', 'Was walking towards MG Road metro station around 8 PM when two men on a bike snatched my phone from my hand and sped away.', 'robbery', 'verified', 12.9720, 77.5933, 6.0, 'robbery', 0.96, now() - interval '3 hours', now() - interval '3 hours'),
('i0000001-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Wallet stolen at MG Road bus stop', 'Someone pickpocketed my wallet while I was boarding a bus at MG Road bus stop. Did not notice until I reached home.', 'theft', 'reported', 12.9715, 77.5938, 8.0, 'theft', 0.94, now() - interval '1 day', now() - interval '1 day'),
('i0000001-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Bicycle stolen from Church Street parking', 'Locked my bicycle at Church Street parking at 10 AM. When I returned at 1 PM, the lock was cut and bicycle was gone.', 'theft', 'verified', 12.9735, 77.5940, 5.0, 'theft', 0.93, now() - interval '2 days', now() - interval '2 days'),
('i0000001-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Harassment near MG Road signal', 'A group of men made inappropriate comments and gestures while I was waiting at the traffic signal near MG Road. They followed me for a short distance.', 'harassment', 'reported', 12.9718, 77.5928, 7.0, 'harassment', 0.91, now() - interval '12 hours', now() - interval '12 hours'),
('i0000001-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'Chain snatching near Commercial Street', 'Two men on a motorcycle snatched a gold chain from an elderly woman near Commercial Street around 6 PM and escaped through one-way lane.', 'robbery', 'verified', 12.9760, 77.5965, 4.5, 'robbery', 0.97, now() - interval '4 days', now() - interval '4 days'),
('i0000001-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 'Suspicious loitering near ATM', 'A man was loitering near the ATM on Museum Road for over an hour, pretending to be on the phone but watching everyone who entered.', 'suspicious_activity', 'reported', 12.9725, 77.5945, 10.0, 'suspicious_activity', 0.78, now() - interval '6 hours', now() - interval '6 hours'),
('i0000001-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'Bag stolen from MG Road café', 'Left my bag on the chair for a moment while ordering at a café on MG Road. When I turned back, it was gone.', 'theft', 'reported', 12.9722, 77.5935, 3.0, 'theft', 0.95, now() - interval '5 days', now() - interval '5 days');

-- Theft cluster near Koramangala (hotspot 2)
INSERT INTO incidents (id, user_id, title, description, incident_type, status, lat, lng, gps_accuracy, classification, confidence, occurred_at, created_at)
VALUES
('i0000002-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Laptop stolen from vehicle near Sony Junction', 'Someone broke the window of my car near Sony Junction, Koramangala and stole my laptop bag from the back seat.', 'theft', 'verified', 12.9350, 77.6240, 8.0, 'theft', 0.96, now() - interval '2 days', now() - interval '2 days'),
('i0000002-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Mobile snatching in 80ft Road', 'A man snatched my phone while I was using Google Maps on 80ft Road, Koramangala around 9 PM. He ran into a narrow lane.', 'robbery', 'reported', 12.9340, 77.6225, 6.5, 'robbery', 0.95, now() - interval '1 day', now() - interval '1 day'),
('i0000002-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Harassment near Koramangala bus stop', 'A group of men were making catcalls and obscene gestures at women waiting at the bus stop near Forum Mall.', 'harassment', 'reported', 12.9360, 77.6230, 9.0, 'harassment', 0.90, now() - interval '3 days', now() - interval '3 days'),
('i0000002-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Cash stolen from parked car', 'Someone broke into my parked car near Kora signal and stole cash and sunglasses from the glove compartment.', 'theft', 'verified', 12.9355, 77.6245, 5.0, 'theft', 0.94, now() - interval '7 days', now() - interval '7 days'),
('i0000002-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'Suspicious activity near fuel station', 'A man was trying to open car doors in the traffic jam near Sony Junction fuel station.', 'suspicious_activity', 'reported', 12.9352, 77.6248, 7.0, 'suspicious_activity', 0.82, now() - interval '4 days', now() - interval '4 days'),
('i0000002-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 'Assault near Jyoti Nivas College', 'A woman was pushed and verbally abused near Jyoti Nivas College around 8 PM. Bystanders intervened and the person fled.', 'assault', 'reported', 12.9330, 77.6210, 6.0, 'assault', 0.88, now() - interval '2 days', now() - interval '2 days');

-- Indiranagar incidents (moderate area)
INSERT INTO incidents (id, user_id, title, description, incident_type, status, lat, lng, gps_accuracy, classification, confidence, occurred_at, created_at)
VALUES
('i0000003-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Phone stolen at Indiranagar metro', 'Phone was stolen from my pocket while boarding a crowded coach at Indiranagar metro station during peak hours.', 'theft', 'verified', 12.9784, 77.6408, 4.0, 'theft', 0.93, now() - interval '5 days', now() - interval '5 days'),
('i0000003-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Vandalism of parked scooters', 'Someone broke the side mirrors and scratched multiple parked two-wheelers on Double Road, Indiranagar overnight.', 'vandalism', 'reported', 12.9790, 77.6415, 12.0, 'vandalism', 0.85, now() - interval '6 days', now() - interval '6 days'),
('i0000003-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Chain snatching near CMH Road', 'Two men on a bike snatched a chain from a woman near the CMH Road signal and escaped towards Old Madras Road.', 'robbery', 'verified', 12.9800, 77.6420, 5.5, 'robbery', 0.96, now() - interval '8 days', now() - interval '8 days'),
('i0000003-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Suspicious person near school', 'An unknown person was seen taking photos of children near the Indiranagar government school during pick-up time.', 'suspicious_activity', 'reported', 12.9775, 77.6400, 8.0, 'suspicious_activity', 0.74, now() - interval '3 days', now() - interval '3 days');

-- Jayanagar incidents (lower crime area)
INSERT INTO incidents (id, user_id, title, description, incident_type, status, lat, lng, gps_accuracy, classification, confidence, occurred_at, created_at)
VALUES
('i0000004-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Bag snatched in Jayanagar 4th Block', 'An elderly woman''s bag was snatched near the 4th Block park in Jayanagar. The snatcher fled on foot.', 'robbery', 'reported', 12.9250, 77.5938, 6.0, 'robbery', 0.94, now() - interval '10 days', now() - interval '10 days'),
('i0000004-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Theft of shoes from doorstep', 'Someone stole a pair of new shoes that were left outside the door of our apartment on 11th Main Road.', 'theft', 'reported', 12.9260, 77.5945, 10.0, 'theft', 0.89, now() - interval '14 days', now() - interval '14 days'),
('i0000004-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Harassment near Jayanagar metro', 'A man on a bike passed inappropriate comments to a woman near the Jayanagar metro station exit.', 'harassment', 'reported', 12.9245, 77.5930, 7.0, 'harassment', 0.87, now() - interval '20 days', now() - interval '20 days');

-- Whitefield incidents
INSERT INTO incidents (id, user_id, title, description, incident_type, status, lat, lng, gps_accuracy, classification, confidence, occurred_at, created_at)
VALUES
('i0000005-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Phone theft at ITPL bus stop', 'Mobile phone stolen from pocket while waiting at ITPL bus stop during morning rush hour.', 'theft', 'verified', 12.9698, 77.7500, 5.0, 'theft', 0.94, now() - interval '3 days', now() - interval '3 days'),
('i0000005-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Woman harassed near Hope Farm junction', 'A man on a bike groped a woman near Hope Farm junction and sped away around 9 PM.', 'harassment', 'reported', 12.9685, 77.7480, 6.5, 'harassment', 0.92, now() - interval '5 days', now() - interval '5 days'),
('i0000005-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Suspicious vehicle near residential area', 'An unmarked van has been circling the residential area near Whitefield post office for several evenings.', 'suspicious_activity', 'reported', 12.9705, 77.7510, 15.0, 'suspicious_activity', 0.71, now() - interval '2 days', now() - interval '2 days');

-- Scattered incidents (various locations)
INSERT INTO incidents (id, user_id, title, description, incident_type, status, lat, lng, gps_accuracy, classification, confidence, occurred_at, created_at)
VALUES
('i0000006-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Vandalism of bus shelter on Silk Board', 'The glass panel at the Silk Board bus shelter was shattered. Sharp glass pieces scattered on the footpath.', 'vandalism', 'reported', 12.9110, 77.6200, 8.0, 'vandalism', 0.83, now() - interval '7 days', now() - interval '7 days'),
('i0000006-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Attempted phone snatching in Majestic', 'Someone tried to snatch my phone near the Majestic bus stand but I held on tight. They ran away into the crowd.', 'robbery', 'reported', 12.9766, 77.5713, 9.0, 'robbery', 0.91, now() - interval '9 days', now() - interval '9 days'),
('i0000006-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Assault near Shivajinagar bus stop', 'A person was physically attacked near the Shivajinagar bus stop around midnight. Victim needed medical attention.', 'assault', 'reported', 12.9810, 77.5740, 7.0, 'assault', 0.93, now() - interval '11 days', now() - interval '11 days'),
('i0000006-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Petty theft at Cubbon Park', 'Someone stole my bag while I was sitting on a bench reading at Cubbon Park. Left it beside me for a minute and it was gone.', 'theft', 'reported', 12.9760, 77.5900, 8.5, 'theft', 0.93, now() - interval '15 days', now() - interval '15 days'),
('i0000006-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'Harassment near Vidhana Soudha', 'Group of men were making lewd comments near the Vidhana Soudha metro exit during evening hours.', 'harassment', 'reported', 12.9790, 77.5800, 10.0, 'harassment', 0.88, now() - interval '18 days', now() - interval '18 days'),
('i0000006-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 'Eve teasing near Malleswaram market', 'A group of young men were passing obscene comments and laughing at women passing through Malleswaram 8th Cross market.', 'harassment', 'reported', 12.9950, 77.5710, 6.0, 'harassment', 0.90, now() - interval '21 days', now() - interval '21 days'),
('i0000006-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'Car window smashed near Lalbagh', 'Came back to my car parked near Lalbagh main gate to find the rear window smashed. Nothing stolen but damage was done.', 'vandalism', 'reported', 12.9520, 77.5850, 8.0, 'vandalism', 0.81, now() - interval '25 days', now() - interval '25 days');

-- ============================================================
-- 3. DEMO CLASSIFICATIONS
-- ============================================================

INSERT INTO classifications (id, incident_id, raw_description, gemini_label, gemini_confidence, gemini_response_raw, mapped_type, reviewed)
SELECT
    'c0000001-0000-0000-0000-000000000001',
    'i0000001-0000-0000-0000-000000000001',
    'Was walking towards MG Road metro station around 8 PM when two men on a bike snatched my phone from my hand and sped away.',
    'Robbery / Snatching',
    0.96,
    '{"candidate": {"safety_ratings": [], "finish_reason": "STOP"}, "usage": {"prompt_tokens": 85, "completion_tokens": 42}}',
    'robbery',
    true
WHERE EXISTS (SELECT 1 FROM incidents WHERE id = 'i0000001-0000-0000-0000-000000000001');

INSERT INTO classifications (id, incident_id, raw_description, gemini_label, gemini_confidence, gemini_response_raw, mapped_type, reviewed)
SELECT
    'c0000001-0000-0000-0000-000000000002',
    'i0000001-0000-0000-0000-000000000002',
    'Someone pickpocketed my wallet while I was boarding a bus at MG Road bus stop. Did not notice until I reached home.',
    'Theft / Pickpocketing',
    0.94,
    '{"candidate": {"safety_ratings": [], "finish_reason": "STOP"}, "usage": {"prompt_tokens": 82, "completion_tokens": 38}}',
    'theft',
    true
WHERE EXISTS (SELECT 1 FROM incidents WHERE id = 'i0000001-0000-0000-0000-000000000002');

INSERT INTO classifications (id, incident_id, raw_description, gemini_label, gemini_confidence, gemini_response_raw, mapped_type, reviewed)
SELECT
    'c0000001-0000-0000-0000-000000000003',
    'i0000002-0000-0000-0000-000000000001',
    'Someone broke the window of my car near Sony Junction, Koramangala and stole my laptop bag from the back seat.',
    'Theft from Vehicle',
    0.96,
    '{"candidate": {"safety_ratings": [], "finish_reason": "STOP"}, "usage": {"prompt_tokens": 88, "completion_tokens": 40}}',
    'theft',
    true
WHERE EXISTS (SELECT 1 FROM incidents WHERE id = 'i0000002-0000-0000-0000-000000000001');

-- ============================================================
-- 4. DEMO HOTSPOTS
-- ============================================================
-- Pre-computed DBSCAN cluster results for demonstration
-- These represent 3 detected hotspot clusters in Bangalore

INSERT INTO hotspots (id, cluster_id, center_lat, center_lng, radius_meters, point_count, incident_types, risk_level, geometry_geojson, created_at, last_updated)
VALUES
(
    'h0000001-0000-0000-0000-000000000001',
    0,
    12.9728,
    77.5940,
    280.0,
    7,
    ARRAY['robbery', 'theft', 'harassment', 'suspicious_activity']::incident_type[],
    'high',
    '{"type":"Polygon","coordinates":[[[12.9750,77.5965],[12.9750,77.5915],[12.9705,77.5915],[12.9705,77.5965],[12.9750,77.5965]]]}',
    now() - interval '1 day',
    now() - interval '1 hour'
),
(
    'h0000001-0000-0000-0000-000000000002',
    1,
    12.9348,
    77.6235,
    200.0,
    6,
    ARRAY['theft', 'robbery', 'harassment', 'assault', 'suspicious_activity']::incident_type[],
    'high',
    '{"type":"Polygon","coordinates":[[[12.9365,77.6255],[12.9365,77.6215],[12.9330,77.6215],[12.9330,77.6255],[12.9365,77.6255]]]}',
    now() - interval '1 day',
    now() - interval '1 hour'
),
(
    'h0000001-0000-0000-0000-000000000003',
    2,
    12.9790,
    77.6410,
    180.0,
    4,
    ARRAY['theft', 'robbery', 'vandalism', 'suspicious_activity']::incident_type[],
    'moderate',
    '{"type":"Polygon","coordinates":[[[12.9805,77.6430],[12.9805,77.6390],[12.9775,77.6390],[12.9775,77.6430],[12.9805,77.6430]]]}',
    now() - interval '1 day',
    now() - interval '12 hours'
);

-- ============================================================
-- 5. DEMO RISK SCORES
-- ============================================================
-- Grid-based risk scores covering the main city area

INSERT INTO risk_scores (lat, lng, score, level, factors, grid_cell_id, calculated_at, expires_at)
VALUES
-- MG Road area (high risk)
(12.9720, 77.5930, 72.5, 'high', '{"incident_density": 0.85, "recency_weight": 0.90, "proximity_to_hotspot": 0.80, "type_severity": 0.60}', '897c00000000000', now(), now() + interval '1 hour'),
(12.9730, 77.5940, 68.0, 'high', '{"incident_density": 0.80, "recency_weight": 0.85, "proximity_to_hotspot": 0.75, "type_severity": 0.55}', '897c00000000001', now(), now() + interval '1 hour'),
(12.9710, 77.5920, 65.0, 'high', '{"incident_density": 0.75, "recency_weight": 0.80, "proximity_to_hotspot": 0.70, "type_severity": 0.50}', '897c00000000002', now(), now() + interval '1 hour'),

-- Koramangala area (high risk)
(12.9350, 77.6240, 70.0, 'high', '{"incident_density": 0.82, "recency_weight": 0.85, "proximity_to_hotspot": 0.78, "type_severity": 0.65}', '897c00000000003', now(), now() + interval '1 hour'),
(12.9340, 77.6230, 66.0, 'high', '{"incident_density": 0.78, "recency_weight": 0.80, "proximity_to_hotspot": 0.72, "type_severity": 0.60}', '897c00000000004', now(), now() + interval '1 hour'),
(12.9360, 77.6250, 63.0, 'high', '{"incident_density": 0.72, "recency_weight": 0.75, "proximity_to_hotspot": 0.68, "type_severity": 0.55}', '897c00000000005', now(), now() + interval '1 hour'),

-- Indiranagar area (moderate risk)
(12.9780, 77.6410, 48.0, 'moderate', '{"incident_density": 0.55, "recency_weight": 0.50, "proximity_to_hotspot": 0.60, "type_severity": 0.45}', '897c00000000006', now(), now() + interval '1 hour'),
(12.9790, 77.6420, 45.0, 'moderate', '{"incident_density": 0.50, "recency_weight": 0.45, "proximity_to_hotspot": 0.55, "type_severity": 0.40}', '897c00000000007', now(), now() + interval '1 hour'),

-- Jayanagar area (low-moderate risk)
(12.9250, 77.5940, 28.0, 'low', '{"incident_density": 0.30, "recency_weight": 0.25, "proximity_to_hotspot": 0.35, "type_severity": 0.30}', '897c00000000008', now(), now() + interval '1 hour'),
(12.9260, 77.5950, 25.0, 'low', '{"incident_density": 0.28, "recency_weight": 0.22, "proximity_to_hotspot": 0.30, "type_severity": 0.28}', '897c00000000009', now(), now() + interval '1 hour'),

-- Cubbon Park area (low risk)
(12.9760, 77.5900, 22.0, 'low', '{"incident_density": 0.20, "recency_weight": 0.15, "proximity_to_hotspot": 0.25, "type_severity": 0.35}', '897c00000000010', now(), now() + interval '1 hour'),
(12.9770, 77.5910, 20.0, 'low', '{"incident_density": 0.18, "recency_weight": 0.12, "proximity_to_hotspot": 0.22, "type_severity": 0.30}', '897c00000000011', now(), now() + interval '1 hour'),

-- Whitefield area (moderate risk)
(12.9700, 77.7500, 42.0, 'moderate', '{"incident_density": 0.48, "recency_weight": 0.52, "proximity_to_hotspot": 0.40, "type_severity": 0.38}', '897c00000000012', now(), now() + interval '1 hour'),
(12.9690, 77.7490, 38.0, 'moderate', '{"incident_density": 0.42, "recency_weight": 0.48, "proximity_to_hotspot": 0.35, "type_severity": 0.35}', '897c00000000013', now(), now() + interval '1 hour'),

-- Majestic area (moderate-high risk)
(12.9770, 77.5710, 55.0, 'high', '{"incident_density": 0.65, "recency_weight": 0.60, "proximity_to_hotspot": 0.55, "type_severity": 0.50}', '897c00000000014', now(), now() + interval '1 hour'),
(12.9760, 77.5720, 52.0, 'high', '{"incident_density": 0.62, "recency_weight": 0.58, "proximity_to_hotspot": 0.52, "type_severity": 0.48}', '897c00000000015', now(), now() + interval '1 hour'),

-- Malleswaram area (low-moderate risk)
(12.9950, 77.5710, 32.0, 'moderate', '{"incident_density": 0.35, "recency_weight": 0.30, "proximity_to_hotspot": 0.32, "type_severity": 0.28}', '897c00000000016', now(), now() + interval '1 hour'),

-- HSR Layout (low risk reference)
(12.9110, 77.6200, 18.0, 'low', '{"incident_density": 0.15, "recency_weight": 0.10, "proximity_to_hotspot": 0.20, "type_severity": 0.25}', '897c00000000017', now(), now() + interval '1 hour'),

-- Vidhana Soudha area (low risk)
(12.9790, 77.5800, 15.0, 'low', '{"incident_density": 0.12, "recency_weight": 0.08, "proximity_to_hotspot": 0.18, "type_severity": 0.22}', '897c00000000018', now(), now() + interval '1 hour');

-- ============================================================
-- 6. DEMO SAFE ROUTE
-- ============================================================

INSERT INTO safe_routes (id, user_id, origin_lat, origin_lng, dest_lat, dest_lng, route_geometry, safety_score, distance_meters, estimated_time_secs, created_at)
VALUES
(
    'r0000001-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    12.9344,  -- Koramangala (origin)
    77.6240,
    12.9716,  -- MG Road (destination)
    77.5946,
    '{"type":"LineString","coordinates":[[12.9344,77.6240],[12.9360,77.6210],[12.9400,77.6180],[12.9450,77.6150],[12.9500,77.6100],[12.9550,77.6050],[12.9600,77.6000],[12.9650,77.5970],[12.9716,77.5946]]}',
    68.5,
    5200,
    900,
    now() - interval '1 day'
);

-- ============================================================
-- 7. VERIFICATION QUERIES
-- ============================================================
-- Run these to verify seed data loaded correctly:
--
-- SELECT 'profiles' AS tbl, COUNT(*) FROM profiles
-- UNION ALL
-- SELECT 'incidents', COUNT(*) FROM incidents
-- UNION ALL
-- SELECT 'classifications', COUNT(*) FROM classifications
-- UNION ALL
-- SELECT 'hotspots', COUNT(*) FROM hotspots
-- UNION ALL
-- SELECT 'risk_scores', COUNT(*) FROM risk_scores
-- UNION ALL
-- SELECT 'safe_routes', COUNT(*) FROM safe_routes;
--
-- Expected counts:
--   profiles:        3
--   incidents:       25
--   classifications: 3
--   hotspots:        3
--   risk_scores:     19
--   safe_routes:     1
-- ============================================================

-- ============================================================
-- END OF SEED
-- ============================================================
