-- Migration 001: Create QR tokens table
-- ShiftTrack QR System — Agent 3

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Stations table (reference only — canonical definition lives in admin-portal migration)
CREATE TABLE IF NOT EXISTS stations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50) NOT NULL CHECK (type IN ('entry', 'work_station')),
    warehouse   VARCHAR(255),
    display_url VARCHAR(512) UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- QR tokens table
CREATE TABLE IF NOT EXISTS qr_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id  UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    token       UUID NOT NULL DEFAULT gen_random_uuid(),
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at     TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

    CONSTRAINT uq_qr_tokens_token UNIQUE (token)
);

-- Index: fast lookup of active (unused, non-expired) tokens per station
CREATE INDEX IF NOT EXISTS idx_qr_tokens_station_active
    ON qr_tokens (station_id)
    WHERE used = FALSE AND expires_at > NOW();

-- Index: token validation query
CREATE INDEX IF NOT EXISTS idx_qr_tokens_token
    ON qr_tokens (token)
    WHERE used = FALSE;

-- Index: TTL cleanup
CREATE INDEX IF NOT EXISTS idx_qr_tokens_expires_at
    ON qr_tokens (expires_at);

-- Helper function for periodic cleanup of expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_qr_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM qr_tokens
    WHERE expires_at < NOW() AND used = FALSE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE qr_tokens IS 'One-time QR token pool — holds the active token for each station';
COMMENT ON COLUMN qr_tokens.token IS 'UUID v4 — embedded in the QR code, one-time use';
COMMENT ON COLUMN qr_tokens.used IS 'Set to true on scan; a new token is generated automatically';
COMMENT ON COLUMN qr_tokens.expires_at IS '24-hour TTL — expired tokens are rejected at check-in';
