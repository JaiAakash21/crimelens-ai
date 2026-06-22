-- ============================================================================
-- CrimeLens AI — Initial Database Schema
-- Migration: 001_initial_schema
-- Description: Core tables, enums, indexes, triggers, and RLS policies
-- Dependencies: pgcrypto (Supabase default), auth.users (Supabase built-in)
-- ============================================================================
-- Apply via:  psql or Supabase SQL Editor (in order)
-- Rollback:   DROP SCHEMA public CASCADE; (destructive — use for dev only)
-- ============================================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
-- pgcrypto is enabled by default in Supabase
-- PostGIS is optional for MVP — uncomment if spatial queries needed
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE incident_type AS ENUM (
    'theft',
    'robbery',
    'harassment',
    'assault',
    'suspicious_activity',
    'vandalism',
    'other'
);

CREATE TYPE incident_status AS ENUM (
    'reported',
    'verified',
    'investigating',
    'resolved',
    'dismissed'
);

CREATE TYPE risk_level AS ENUM (
    'low',
    'moderate',
    'high',
    'critical'
);

CREATE TYPE user_role AS ENUM (
    'citizen',
    'analyst',
    'admin'
);

-- ============================================================
-- 2. TABLES
-- ============================================================

-- -----------------------------------------------------------
-- 2.1 profiles
-- Extends Supabase auth.users with app-specific fields
-- -----------------------------------------------------------
CREATE TABLE profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email         TEXT NOT NULL,
    full_name     TEXT,
    avatar_url    TEXT,
    role          user_role NOT NULL DEFAULT 'citizen',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Ensure email is reasonable
    CONSTRAINT profiles_email_check
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE profiles IS 'Extends auth.users with app-specific profile data and role.';
COMMENT ON COLUMN profiles.role IS 'citizen: default reporter. analyst: dashboard access. admin: full system access.';
COMMENT ON COLUMN profiles.updated_at IS 'Managed by update_updated_at trigger.';

-- -----------------------------------------------------------
-- 2.2 incidents
-- Core entity — citizen-submitted crime/safety reports
-- -----------------------------------------------------------
CREATE TABLE incidents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    incident_type   incident_type NOT NULL DEFAULT 'other',
    status          incident_status NOT NULL DEFAULT 'reported',
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    gps_accuracy    DOUBLE PRECISION,            -- meters (null if unknown)
    classification  incident_type,               -- AI-predicted type (Gemini)
    confidence      DOUBLE PRECISION,            -- Gemini confidence score [0, 1]
    occurred_at     TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT incidents_title_length
        CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
    CONSTRAINT incidents_description_length
        CHECK (char_length(description) >= 10 AND char_length(description) <= 5000),
    CONSTRAINT incidents_lat_range
        CHECK (lat >= -90 AND lat <= 90),
    CONSTRAINT incidents_lng_range
        CHECK (lng >= -180 AND lng <= 180),
    CONSTRAINT incidents_confidence_range
        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    CONSTRAINT incidents_gps_accuracy_positive
        CHECK (gps_accuracy IS NULL OR gps_accuracy >= 0),
    CONSTRAINT incidents_occurred_at_not_future
        CHECK (occurred_at <= now() + interval '1 hour')
);

COMMENT ON TABLE incidents IS 'Crime and safety incident reports submitted by citizens.';
COMMENT ON COLUMN incidents.incident_type IS 'User-selected category at time of report.';
COMMENT ON COLUMN incidents.classification IS 'AI-predicted category — set asynchronously by Gemini classifier service.';
COMMENT ON COLUMN incidents.confidence IS 'Confidence score from AI classification (0.0 to 1.0).';
COMMENT ON COLUMN incidents.gps_accuracy IS 'GPS horizontal accuracy in meters from device.';
COMMENT ON COLUMN incidents.occurred_at IS 'When the incident actually occurred (user-reported).';

-- -----------------------------------------------------------
-- 2.3 classifications
-- Audit trail for every AI classification performed
-- -----------------------------------------------------------
CREATE TABLE classifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id         UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    raw_description     TEXT NOT NULL,            -- Input sent to Gemini
    gemini_label        TEXT NOT NULL,            -- Raw label from Gemini response
    gemini_confidence   DOUBLE PRECISION NOT NULL,
    gemini_response_raw JSONB,                   -- Full response payload (debugging)
    mapped_type         incident_type,            -- Label mapped to our enum
    reviewed            BOOLEAN NOT NULL DEFAULT false,
    reviewed_by         UUID REFERENCES profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT classifications_confidence_range
        CHECK (gemini_confidence >= 0 AND gemini_confidence <= 1)
);

COMMENT ON TABLE classifications IS 'Audit log for all AI classification events from Gemini.';
COMMENT ON COLUMN classifications.gemini_response_raw IS 'Full Gemini API response stored as JSONB for debugging and model improvement.';
COMMENT ON COLUMN classifications.mapped_type IS 'Gemini label mapped to our incident_type enum. NULL if mapping fails.';
COMMENT ON COLUMN classifications.reviewed IS 'Has a human reviewed/corrected this classification?';

-- -----------------------------------------------------------
-- 2.4 incident_images
-- Links image files in Supabase Storage to incidents
-- -----------------------------------------------------------
CREATE TABLE incident_images (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id   UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    storage_path  TEXT NOT NULL,                  -- Path in Supabase Storage bucket
    width         INT,                            -- Image width in pixels
    height        INT,                            -- Image height in pixels
    file_size     BIGINT,                         -- File size in bytes
    mime_type     TEXT DEFAULT 'image/jpeg',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT incident_images_positive_dimensions
        CHECK (width IS NULL OR width > 0),
    CONSTRAINT incident_images_positive_size
        CHECK (file_size IS NULL OR file_size > 0)
);

COMMENT ON TABLE incident_images IS 'Maps image files in Supabase Storage bucket to incidents.';
COMMENT ON COLUMN incident_images.storage_path IS 'Relative path in the incident-images Storage bucket, e.g. incidents/<uuid>/<filename>.jpg';

-- -----------------------------------------------------------
-- 2.5 hotspots
-- Output of DBSCAN clustering — represents high-crime areas
-- -----------------------------------------------------------
CREATE TABLE hotspots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id      INT NOT NULL,                 -- DBSCAN cluster label (-1 = noise, excluded)
    center_lat      DOUBLE PRECISION NOT NULL,
    center_lng      DOUBLE PRECISION NOT NULL,
    radius_meters   DOUBLE PRECISION NOT NULL,    -- Approximate radius covering cluster points
    point_count     INT NOT NULL,                 -- Number of incidents in this cluster
    incident_types  incident_type[] NOT NULL DEFAULT '{}',
    risk_level      risk_level NOT NULL DEFAULT 'moderate',
    geometry_geojson JSONB,                       -- Polygon of cluster convex hull
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT hotspots_positive_count
        CHECK (point_count > 0),
    CONSTRAINT hotspots_positive_radius
        CHECK (radius_meters >= 0)
);

COMMENT ON TABLE hotspots IS 'Crime hotspots detected by DBSCAN clustering algorithm.';
COMMENT ON COLUMN hotspots.cluster_id IS 'DBSCAN cluster identifier. Only clusters with >= min_samples are stored (noise excluded).';
COMMENT ON COLUMN hotspots.radius_meters IS 'Approximate radius of the cluster in meters (max distance from center to farthest point).';
COMMENT ON COLUMN hotspots.incident_types IS 'Array of distinct incident types present in this cluster.';
COMMENT ON COLUMN hotspots.geometry_geojson IS 'GeoJSON Polygon representing the convex hull of the cluster. Optional — computed if point_count >= 3.';

-- -----------------------------------------------------------
-- 2.6 risk_scores
-- Pre-computed safety scores on a spatial grid
-- -----------------------------------------------------------
CREATE TABLE risk_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    score           DOUBLE PRECISION NOT NULL,    -- 0 (safest) to 100 (most dangerous)
    level           risk_level NOT NULL,
    factors         JSONB NOT NULL DEFAULT '{}',  -- Breakdown: density, recency, proximity weights
    grid_cell_id    TEXT,                         -- H3 cell index at resolution 9
    calculated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,         -- Scores become stale after this time

    -- Constraints
    CONSTRAINT risk_scores_score_range
        CHECK (score >= 0 AND score <= 100),
    CONSTRAINT risk_scores_expires_future
        CHECK (expires_at > calculated_at)
);

COMMENT ON TABLE risk_scores IS 'Pre-computed safety risk scores on a spatial grid. Refreshed periodically by background job.';
COMMENT ON COLUMN risk_scores.score IS '0 = safest, 100 = most dangerous.';
COMMENT ON COLUMN risk_scores.factors IS 'JSON object with factor weights: {"incident_density": 0.8, "recency_weight": 0.6, "proximity_to_hotspot": 0.7, "type_severity": 0.4}';
COMMENT ON COLUMN risk_scores.grid_cell_id IS 'H3 hexagon cell index at resolution 9 (~174m diameter). Enables fast spatial lookups without PostGIS.';
COMMENT ON COLUMN risk_scores.expires_at IS 'Scores are recalculated on a schedule; expired scores should not be served.';

-- -----------------------------------------------------------
-- 2.7 safe_routes
-- Cached route recommendations with safety scores
-- -----------------------------------------------------------
CREATE TABLE safe_routes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    origin_lat        DOUBLE PRECISION NOT NULL,
    origin_lng        DOUBLE PRECISION NOT NULL,
    dest_lat          DOUBLE PRECISION NOT NULL,
    dest_lng          DOUBLE PRECISION NOT NULL,
    route_geometry    JSONB NOT NULL,             -- GeoJSON LineString
    safety_score      DOUBLE PRECISION NOT NULL,  -- 0 = dangerous, 100 = safest
    distance_meters   DOUBLE PRECISION NOT NULL,
    estimated_time_secs INT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT safe_routes_score_range
        CHECK (safety_score >= 0 AND safety_score <= 100),
    CONSTRAINT safe_routes_positive_distance
        CHECK (distance_meters > 0),
    CONSTRAINT safe_routes_positive_time
        CHECK (estimated_time_secs > 0)
);

COMMENT ON TABLE safe_routes IS 'Cached safe route recommendations. Keyed by (user_id, origin, dest) for deduplication.';
COMMENT ON COLUMN safe_routes.route_geometry IS 'GeoJSON LineString representing the recommended path.';
COMMENT ON COLUMN safe_routes.safety_score IS 'Aggregate safety score for the route (0 = dangerous, 100 = safest).';

-- ============================================================
-- 3. INDEXES
-- ============================================================

-- 3.1 profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- 3.2 incidents indexes
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_location ON incidents(lat, lng);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_occurred_at ON incidents(occurred_at DESC);
CREATE INDEX idx_incidents_classification ON incidents(classification);
CREATE INDEX idx_incidents_user_recent ON incidents(user_id, created_at DESC);
CREATE INDEX idx_incidents_type_status ON incidents(incident_type, status);

-- Composite index for hotspot detection query:
--   SELECT * FROM incidents WHERE status != 'dismissed'
--   AND created_at > now() - interval '90 days'
--   AND lat BETWEEN ... AND ... AND lng BETWEEN ... AND ...
CREATE INDEX idx_incidents_hotspot_query
    ON incidents(status, created_at, lat, lng)
    WHERE status != 'dismissed';

-- Full-text search on title and description (for future search feature)
-- CREATE INDEX idx_incidents_fts ON incidents
--     USING GIN(to_tsvector('english', title || ' ' || description));

-- 3.3 classifications indexes
CREATE INDEX idx_classifications_incident ON classifications(incident_id);
CREATE INDEX idx_classifications_reviewed ON classifications(reviewed) WHERE reviewed = false;
CREATE INDEX idx_classifications_created ON classifications(created_at DESC);

-- 3.4 incident_images indexes
CREATE INDEX idx_incident_images_incident ON incident_images(incident_id);

-- 3.5 hotspots indexes
CREATE INDEX idx_hotspots_center ON hotspots(center_lat, center_lng);
CREATE INDEX idx_hotspots_risk_level ON hotspots(risk_level);
CREATE INDEX idx_hotspots_updated ON hotspots(last_updated DESC);
CREATE INDEX idx_hotspots_cluster_id ON hotspots(cluster_id);

-- 3.6 risk_scores indexes
CREATE INDEX idx_risk_scores_grid ON risk_scores(grid_cell_id);
CREATE INDEX idx_risk_scores_expires ON risk_scores(expires_at);
CREATE INDEX idx_risk_scores_location ON risk_scores(lat, lng);
CREATE INDEX idx_risk_scores_level ON risk_scores(level);
CREATE INDEX idx_risk_scores_active
    ON risk_scores(lat, lng, score)
    WHERE expires_at > now();

-- 3.7 safe_routes indexes
CREATE INDEX idx_safe_routes_user ON safe_routes(user_id);
CREATE INDEX idx_safe_routes_created ON safe_routes(created_at DESC);
CREATE INDEX idx_safe_routes_user_recent ON safe_routes(user_id, created_at DESC);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- 4.1 Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Automatically creates a profiles row when a new user signs up via Supabase Auth.';

-- 4.2 Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at IS 'Sets updated_at to current timestamp on row modification.';

--- profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

--- incidents
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

--- hotspots
CREATE TRIGGER update_hotspots_updated_at
    BEFORE UPDATE ON hotspots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

-- 5.0 Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_routes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5.1 profiles policies
-- ============================================================

CREATE POLICY profiles_select_all
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY profiles_insert_self
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_self
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only admins can update roles
CREATE POLICY profiles_update_role_admin
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- 5.2 incidents policies
-- ============================================================

CREATE POLICY incidents_select_all
    ON incidents FOR SELECT
    USING (true);

CREATE POLICY incidents_insert_authenticated
    ON incidents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY incidents_update_own
    ON incidents FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY incidents_update_status_admin
    ON incidents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin')
        )
    );

CREATE POLICY incidents_delete_own
    ON incidents FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY incidents_delete_admin
    ON incidents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- 5.3 classifications policies
-- ============================================================

CREATE POLICY classifications_select_all
    ON classifications FOR SELECT
    USING (true);

CREATE POLICY classifications_insert_service
    ON classifications FOR INSERT
    WITH CHECK (true);  -- Insert via service_role key on backend

CREATE POLICY classifications_review
    ON classifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin')
        )
    );

-- ============================================================
-- 5.4 incident_images policies
-- ============================================================

CREATE POLICY incident_images_select_all
    ON incident_images FOR SELECT
    USING (true);

CREATE POLICY incident_images_insert_owner
    ON incident_images FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM incidents
            WHERE id = incident_id AND user_id = auth.uid()
        )
    );

CREATE POLICY incident_images_delete_owner
    ON incident_images FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM incidents
            WHERE id = incident_id AND user_id = auth.uid()
        )
    );

-- ============================================================
-- 5.5 hotspots policies
-- ============================================================

CREATE POLICY hotspots_select_all
    ON hotspots FOR SELECT
    USING (true);

CREATE POLICY hotspots_insert_admin
    ON hotspots FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY hotspots_update_admin
    ON hotspots FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- 5.6 risk_scores policies
-- ============================================================

CREATE POLICY risk_scores_select_all
    ON risk_scores FOR SELECT
    USING (true);

CREATE POLICY risk_scores_insert_service
    ON risk_scores FOR INSERT
    WITH CHECK (true);  -- Insert via service_role key

-- ============================================================
-- 5.7 safe_routes policies
-- ============================================================

CREATE POLICY safe_routes_select_own
    ON safe_routes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY safe_routes_insert_own
    ON safe_routes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY safe_routes_delete_own
    ON safe_routes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- 6. HELPER FUNCTIONS
-- ============================================================

-- 6.1 Get risk level from numeric score
CREATE OR REPLACE FUNCTION score_to_risk_level(score DOUBLE PRECISION)
RETURNS risk_level
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE
        WHEN score < 25 THEN 'low'::risk_level
        WHEN score < 50 THEN 'moderate'::risk_level
        WHEN score < 75 THEN 'high'::risk_level
        ELSE 'critical'::risk_level
    END;
END;
$$;

COMMENT ON FUNCTION score_to_risk_level IS 'Converts a numeric risk score (0-100) to a risk_level enum value.';

-- 6.2 Haversine distance (meters) between two coordinates
CREATE OR REPLACE FUNCTION haversine_distance(
    lat1 DOUBLE PRECISION,
    lng1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    dlat DOUBLE PRECISION;
    dlng DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
    r DOUBLE PRECISION = 6371000;  -- Earth radius in meters
BEGIN
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    a := sin(dlat / 2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2)^2;
    c := 2 * asin(sqrt(a));
    RETURN r * c;
END;
$$;

COMMENT ON FUNCTION haversine_distance IS 'Calculates great-circle distance in meters between two GPS coordinates using the Haversine formula.';

-- ============================================================
-- 7. MATERIALIZED VIEW (optional — uncomment if needed)
-- ============================================================
-- Pre-aggregated daily stats for dashboard performance.
-- Refresh via: REFRESH MATERIALIZED VIEW CONCURRENTLY daily_incident_stats;
--
-- CREATE MATERIALIZED VIEW daily_incident_stats AS
-- SELECT
--     date_trunc('day', occurred_at)::date AS day,
--     incident_type,
--     COUNT(*) AS incident_count,
--     AVG(CASE WHEN confidence IS NOT NULL THEN confidence END) AS avg_confidence
-- FROM incidents
-- WHERE status != 'dismissed'
-- GROUP BY 1, 2
-- ORDER BY 1 DESC, 2;
--
-- CREATE UNIQUE INDEX idx_daily_stats_date_type
--     ON daily_incident_stats(day, incident_type);

-- ============================================================
-- END OF MIGRATION
-- ============================================================
