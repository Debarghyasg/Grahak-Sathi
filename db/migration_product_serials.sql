-- ============================================================================
-- SmartRetail — Product serials (MK-IDs) catalogue
-- ============================================================================
-- Source of truth for the valid manufacturer serial numbers (MK-IDs) of each
-- product, keyed by barcode. Used at checkout to detect SWAPPED / counterfeit
-- units: if the scanned/typed MK-ID isn't a registered serial for that barcode,
-- the item is rejected (MK_ID_MISMATCH).
--
-- Previously the only serial source was the 4-product MOCK_DB hardcoded in
-- api/product_catalog.py, so any real inventory item silently passed MK-ID
-- validation (fail-open). This table lets validation work for real products too;
-- the API unions this table with MOCK_DB.
--
-- Safe to run multiple times (IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_serials (
    id          BIGSERIAL PRIMARY KEY,
    barcode     TEXT        NOT NULL,            -- product barcode (EAN-13 / UPC-A)
    mk_id       TEXT        NOT NULL,            -- a valid manufacturer serial for it
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (barcode, mk_id)
);

CREATE INDEX IF NOT EXISTS idx_product_serials_barcode ON product_serials (barcode);

-- Seed the demo products' serials so DB-backed validation matches MOCK_DB.
INSERT INTO product_serials (barcode, mk_id) VALUES
    ('8901030823437', 'MK-MILO-2024-A001'),
    ('8901030823437', 'MK-MILO-2024-A002'),
    ('8901030823437', 'MK-MILO-2024-A003'),
    ('8901030823437', 'MK-MILO-2024-B001'),
    ('8901030823437', 'MK-MILO-2024-B002'),
    ('8901491503217', 'MK-BRV-2024-X101'),
    ('8901491503217', 'MK-BRV-2024-X102'),
    ('8901491503217', 'MK-BRV-2024-X103'),
    ('8901491503217', 'MK-BRV-2024-Y201'),
    ('8901491503217', 'MK-BRV-2024-Y202'),
    ('012345678905',  'MK-CLG-2024-P010'),
    ('012345678905',  'MK-CLG-2024-P011'),
    ('012345678905',  'MK-CLG-2024-P012'),
    ('012345678905',  'MK-CLG-2024-Q020'),
    ('012345678905',  'MK-CLG-2024-Q021'),
    ('4006381333931', 'MK-NVA-2024-C301'),
    ('4006381333931', 'MK-NVA-2024-C302'),
    ('4006381333931', 'MK-NVA-2024-C303'),
    ('4006381333931', 'MK-NVA-2024-D401'),
    ('4006381333931', 'MK-NVA-2024-D402')
ON CONFLICT (barcode, mk_id) DO NOTHING;
