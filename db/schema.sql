-- Idempotent schema; applied on every app start by scripts/migrate.mjs.

-- One row per booked seat. Seats booked together in one form share a group_id.
-- Delete a row to free the seat.
CREATE TABLE IF NOT EXISTS bookings (
  id         SERIAL PRIMARY KEY,
  group_id   UUID         NOT NULL,
  seat_code  VARCHAR(10)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Upgrade from v1 (one seat per phone number, no groups).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_id UUID;
UPDATE bookings SET group_id = gen_random_uuid() WHERE group_id IS NULL;
ALTER TABLE bookings ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_phone_key;
CREATE INDEX IF NOT EXISTS bookings_phone_idx ON bookings (phone);
CREATE INDEX IF NOT EXISTS bookings_group_idx ON bookings (group_id);

-- Event details edited from /admin/pengaturan. Single row (id = 1).
-- Until the admin saves once, the app uses defaultSettings from src/config/event.ts.
CREATE TABLE IF NOT EXISTS settings (
  id               SMALLINT     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  fellowship_title VARCHAR(100) NOT NULL,
  movie_title      VARCHAR(100) NOT NULL,
  location         VARCHAR(100) NOT NULL,
  event_date       DATE         NOT NULL,
  event_time       TIME         NOT NULL,
  seat_rows        SMALLINT     NOT NULL,
  seats_per_row    SMALLINT     NOT NULL,
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
