-- BillSleeve Database Schema
-- Run once to set up all tables.
-- Use: psql -U billsleeve -d billsleeve -f 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Bills ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_name      TEXT,              -- populated after OCR
    total_amount    NUMERIC(12, 2),    -- populated after OCR
    purchase_date   DATE,              -- populated after OCR
    encrypted_path  TEXT NOT NULL,     -- path to the AES-encrypted image file
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);

-- ── Warranties ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warranties (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id      UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_name TEXT,
    brand        TEXT,
    serial_no    TEXT,
    expires_at   DATE,
    registered   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranties_bill_id ON warranties(bill_id);

-- ── Agent Jobs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warranty_id     UUID REFERENCES warranties(id),
    status          TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | failed
    proof_path      TEXT,        -- screenshot of the registration confirmation page
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Audit Logs (Immutable — never UPDATE or DELETE rows here) ─────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      TEXT NOT NULL,    -- e.g. "bill_uploaded", "warranty_registered"
    details     JSONB,            -- flexible field for extra context
    prev_hash   TEXT,             -- SHA-256 hash of the previous row
    this_hash   TEXT,             -- hash of this row (tamper-evident chain)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
