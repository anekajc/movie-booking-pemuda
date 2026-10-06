-- Movie night seat bookings. Seats themselves are defined in src/config/event.ts;
-- a row here means that seat is taken. Delete a row to free the seat.
CREATE TABLE IF NOT EXISTS bookings (
  id         SERIAL PRIMARY KEY,
  seat_code  VARCHAR(10)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
