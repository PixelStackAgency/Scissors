-- ============================================================
-- SCISSORS MEN'S BEAUTY LOUNGE — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── BRANCHES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  area        TEXT NOT NULL,
  city        TEXT NOT NULL DEFAULT 'Bhatkal, Karnataka 581320',
  phone       TEXT NOT NULL,
  hours       TEXT NOT NULL DEFAULT '9:00 AM – 9:00 PM',
  map_url     TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO branches (name, area, phone, map_url) VALUES
  ('Branch 1 — Main Road',     'Main Road, Bhatkal',          '+91 98765 43210', 'https://share.google/1RWsx10jULttWMb3e'),
  ('Branch 2 — New Bus Stand', 'New Bus Stand Area, Bhatkal', '+91 98765 43211', 'https://share.google/42cneZWvx2O8wKcsP');

-- ── SERVICES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT,
  price             INTEGER NOT NULL,
  duration_minutes  INTEGER NOT NULL,
  icon              TEXT DEFAULT '✂️',
  is_popular        BOOLEAN DEFAULT FALSE,
  is_active         BOOLEAN DEFAULT TRUE,
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO services (name, description, price, duration_minutes, icon, is_popular, sort_order) VALUES
  ('Haircut',              'Precision cut for your style',          150, 30,  '✂️', TRUE,  1),
  ('Hair + Beard Combo',   'Complete grooming package',             220, 45,  '💈', TRUE,  2),
  ('Beard Trim & Shape',   'Sharp, defined beard lines',            80,  20,  '🪒', FALSE, 3),
  ('Clean Shave',          'Classic hot towel shave',               100, 25,  '🪒', FALSE, 4),
  ('Hair Color',           'Root touch-up or full color',           500, 60,  '🎨', FALSE, 5),
  ('Facial',               'Deep cleanse & glow treatment',         350, 45,  '🌿', TRUE,  6),
  ('Hair Treatment',       'Protein repair & nourishment',          600, 60,  '💆', FALSE, 7),
  ('Head Massage',         'Relaxing scalp therapy',                200, 30,  '🤲', FALSE, 8),
  ('D-Tan & Cleanup',      'Skin brightening therapy',              400, 40,  '✨', FALSE, 9),
  ('Threading',            'Eyebrow & face threading',              50,  15,  '🧵', FALSE, 10);

-- ── STAFF ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_code      TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,
  branch_id       INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  phone           TEXT,
  bio             TEXT,
  avatar_color    TEXT DEFAULT '#c8a86e',
  service_ids     INTEGER[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  join_date       DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO staff (staff_code, name, role, branch_id, phone, service_ids, avatar_color) VALUES
  ('ST001', 'Ahmed Shaikh',    'Senior Barber',    1, '9876500001', '{1,2,3,4}',       '#b07840'),
  ('ST002', 'Riyaz Khan',      'Color Specialist', 1, '9876500002', '{1,5,7}',         '#806040'),
  ('ST003', 'Farhan Siddiqui', 'Grooming Expert',  2, '9876500003', '{1,2,3,4,6,8}',  '#a08050'),
  ('ST004', 'Imran Patel',     'Skin Therapist',   2, '9876500004', '{6,9,10}',        '#907060');

-- ── BOOKINGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_ref       TEXT UNIQUE NOT NULL,
  branch_id         INTEGER REFERENCES branches(id),
  staff_id          UUID REFERENCES staff(id) ON DELETE SET NULL,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  note              TEXT DEFAULT '',
  booking_date      DATE NOT NULL,
  time_str          TEXT NOT NULL,
  time_minutes      INTEGER NOT NULL,
  duration_minutes  INTEGER NOT NULL,
  total_price       INTEGER NOT NULL,
  status            TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','completed','cancelled','no_show')),
  services          JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast slot availability queries
CREATE INDEX IF NOT EXISTS idx_bookings_date_branch   ON bookings(booking_date, branch_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_staff    ON bookings(booking_date, staff_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_ref           ON bookings(booking_ref);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public read access for branches, services, staff
CREATE POLICY "Public read branches" ON branches FOR SELECT USING (TRUE);
CREATE POLICY "Public read services" ON services FOR SELECT USING (TRUE);
CREATE POLICY "Public read staff"    ON staff    FOR SELECT USING (is_active = TRUE);

-- Public can insert bookings (anonymous booking)
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public read own booking" ON bookings FOR SELECT USING (TRUE);

-- Service role (admin) has full access
CREATE POLICY "Service full branches" ON branches USING (auth.role() = 'service_role');
CREATE POLICY "Service full services" ON services USING (auth.role() = 'service_role');
CREATE POLICY "Service full staff"    ON staff    USING (auth.role() = 'service_role');
CREATE POLICY "Service full bookings" ON bookings USING (auth.role() = 'service_role');

-- ── REALTIME ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
