CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE zones (
    zone_id     VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    ph_min      NUMERIC(4,2) NOT NULL,
    ph_max      NUMERIC(4,2) NOT NULL,
    ec_min      NUMERIC(4,2) NOT NULL,
    ec_max      NUMERIC(4,2) NOT NULL,
    temp_min    NUMERIC(4,2) NOT NULL,
    temp_max    NUMERIC(4,2) NOT NULL,
    priority    SMALLINT NOT NULL CHECK (priority BETWEEN 1 AND 10),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_ph_range CHECK (ph_min < ph_max),
    CONSTRAINT chk_ec_range CHECK (ec_min < ec_max),
    CONSTRAINT chk_temp_range CHECK (temp_min < temp_max)
);

CREATE TABLE arbitration_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          VARCHAR(50) NOT NULL,
    zone_id             VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
    requested_at        TIMESTAMPTZ NOT NULL,
    decision            VARCHAR(20) NOT NULL CHECK (decision IN ('fulfilled', 'queued', 'rejected')),
    reason              TEXT NOT NULL,
    score               NUMERIC(5,4),
    volume_requested    NUMERIC(6,2),
    tank_volume_after   NUMERIC(6,2),
    decided_at          TIMESTAMPTZ
);

CREATE INDEX idx_arbitration_logs_requested_at ON arbitration_logs (requested_at DESC);
CREATE INDEX idx_arbitration_logs_zone_id ON arbitration_logs (zone_id);

CREATE TABLE tank_status (
    id              SMALLINT PRIMARY KEY DEFAULT 1,
    current_volume  NUMERIC(6,2) NOT NULL,
    capacity        NUMERIC(6,2) NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_single_row CHECK (id = 1),
    CONSTRAINT chk_volume_valid CHECK (current_volume >= 0 AND current_volume <= capacity)
);

INSERT INTO tank_status (id, current_volume, capacity) VALUES (1, 200.0, 200.0);

INSERT INTO zones (zone_id, name, ph_min, ph_max, ec_min, ec_max, temp_min, temp_max, priority) VALUES
    ('zone-a', 'Zona A - Kangkung', 5.5, 6.5, 1.5, 2.5, 22.0, 28.0, 8),
    ('zone-b', 'Zona B - Selada',   5.4, 6.0, 0.8, 1.4, 18.0, 22.0, 6);
