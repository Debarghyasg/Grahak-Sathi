-- ============================================================================
-- SmartRetail — Refund demo seed (pure SQL, no Node required)
-- ============================================================================
-- Use this when `npm run seed:refund-demo` can't be used or when you want to be
-- 100% sure the demo rows land in the SAME database the API queries.
--
-- Run it against the EXACT database your FastAPI service uses, e.g.:
--   psql "postgresql://postgres:1221@localhost:5432/Netra" -f db/seed_refund_demo.sql
--   psql "$DATABASE_URL" -f db/seed_refund_demo.sql
--
-- The refund-pickup flow matches on transaction_id -> mk_id/barcode, so the
-- stored image_b64 is irrelevant here (a placeholder is fine). OCR runs on the
-- photo the CUSTOMER uploads, not on this stored value.
--
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- Ensure the table + mk_id column exist (in case migrations weren't applied).
CREATE TABLE IF NOT EXISTS checkout_images (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  TEXT        NOT NULL,
    shop_id         INTEGER,
    barcode         TEXT,
    image_b64       TEXT        NOT NULL,
    mk_id           TEXT,
    purchase_channel TEXT       NOT NULL DEFAULT 'offline',
    return_eligible_until TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE checkout_images ADD COLUMN IF NOT EXISTS mk_id TEXT;
ALTER TABLE checkout_images ADD COLUMN IF NOT EXISTS purchase_channel TEXT NOT NULL DEFAULT 'offline';
ALTER TABLE checkout_images ADD COLUMN IF NOT EXISTS return_eligible_until TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_checkout_images_txn_mkid ON checkout_images (transaction_id, mk_id);

-- Fresh demo rows.
DELETE FROM checkout_images WHERE transaction_id IN ('100000000001', '100000000002');

-- MILO  → transaction 100000000001 (offline)
INSERT INTO checkout_images
    (transaction_id, shop_id, barcode, image_b64, mk_id, purchase_channel, return_eligible_until, created_at)
VALUES
    ('100000000001', 1, '8901030823437',
     'data:image/jpeg;base64,/9j/PLACEHOLDER',
     'MK-MILO-2024-A001', 'offline', NOW() + INTERVAL '30 days', NOW());

-- COLGATE → transaction 100000000002 (online)
INSERT INTO checkout_images
    (transaction_id, shop_id, barcode, image_b64, mk_id, purchase_channel, return_eligible_until, created_at)
VALUES
    ('100000000002', 1, '012345678905',
     'data:image/jpeg;base64,/9j/PLACEHOLDER',
     'MK-CLG-2024-P010', 'online', NOW() + INTERVAL '30 days', NOW());

-- Verify (should print 2 rows).
SELECT transaction_id, mk_id, barcode, purchase_channel
FROM checkout_images
WHERE transaction_id IN ('100000000001', '100000000002')
ORDER BY transaction_id;
