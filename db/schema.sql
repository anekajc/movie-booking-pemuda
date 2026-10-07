-- Idempotent schema; applied on every app start by scripts/migrate.mjs.
-- Safe to run on a fresh database and on databases created by earlier versions.

-- Events. Exactly one is active (archived_at IS NULL); "Arsipkan & mulai acara baru"
-- archives it and starts a new one, keeping its bookings and attendance as history.
CREATE TABLE IF NOT EXISTS events (
  id               SERIAL       PRIMARY KEY,
  fellowship_title VARCHAR(100) NOT NULL,
  movie_title      VARCHAR(100) NOT NULL,
  location         VARCHAR(100) NOT NULL,
  event_date       DATE         NOT NULL,
  event_time       TIME         NOT NULL,
  seat_rows        SMALLINT     NOT NULL,
  seats_per_row    SMALLINT     NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  archived_at      TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS events_one_active ON events ((archived_at IS NULL)) WHERE archived_at IS NULL;

-- Upgrade from v2: move the single-row settings table into the first event.
DO $$
BEGIN
  IF to_regclass('public.settings') IS NOT NULL THEN
    INSERT INTO events (fellowship_title, movie_title, location, event_date, event_time, seat_rows, seats_per_row)
    SELECT fellowship_title, movie_title, location, event_date, event_time, seat_rows, seats_per_row
      FROM settings WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM events);
    DROP TABLE settings;
  END IF;
END $$;

-- Make sure there is always an active event (placeholder values; edit in /admin/pengaturan).
INSERT INTO events (fellowship_title, movie_title, location, event_date, event_time, seat_rows, seats_per_row)
SELECT 'Movie Fellowship', 'Judul Film', 'GSG Lt. 2', CURRENT_DATE + 7, '18:30', 6, 10
 WHERE NOT EXISTS (SELECT 1 FROM events WHERE archived_at IS NULL);

-- One row per booked seat. Seats booked together in one form share a group_id
-- (that is what the ticket QR points to). Delete a row to free the seat.
CREATE TABLE IF NOT EXISTS bookings (
  id            SERIAL       PRIMARY KEY,
  event_id      INT          NOT NULL REFERENCES events (id),
  group_id      UUID         NOT NULL,
  seat_code     VARCHAR(10)  NOT NULL,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  checked_in_at TIMESTAMPTZ
);

-- Upgrade from v1 (one seat per phone number, no groups).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_id UUID;
UPDATE bookings SET group_id = gen_random_uuid() WHERE group_id IS NULL;
ALTER TABLE bookings ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_phone_key;

-- Upgrade from v2 (no events, no attendance).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_id INT REFERENCES events (id);
UPDATE bookings SET event_id = (SELECT id FROM events WHERE archived_at IS NULL) WHERE event_id IS NULL;
ALTER TABLE bookings ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_seat_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_event_seat_key ON bookings (event_id, seat_code);
CREATE INDEX IF NOT EXISTS bookings_event_phone_idx ON bookings (event_id, phone);
CREATE INDEX IF NOT EXISTS bookings_group_idx ON bookings (group_id);
DROP INDEX IF EXISTS bookings_phone_idx;

-- People who came without registering, added by the admin at the door.
CREATE TABLE IF NOT EXISTS walk_ins (
  id         SERIAL       PRIMARY KEY,
  event_id   INT          NOT NULL REFERENCES events (id),
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS walk_ins_event_idx ON walk_ins (event_id);
