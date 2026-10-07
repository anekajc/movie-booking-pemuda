import { Pool, types } from "pg";

// Keep DATE columns as "YYYY-MM-DD" strings instead of local-midnight Date objects.
types.setTypeParser(types.builtins.DATE, (v) => v);

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export type Booking = {
  id: number;
  event_id: number;
  group_id: string;
  seat_code: string;
  name: string;
  phone: string;
  created_at: Date;
  checked_in_at: Date | null;
};

export type WalkIn = {
  id: number;
  name: string;
  phone: string | null;
  created_at: Date;
};

const BOOKING_COLUMNS = "id, event_id, group_id, seat_code, name, phone, created_at, checked_in_at";

export async function getTakenSeats(eventId: number): Promise<string[]> {
  const { rows } = await pool.query<{ seat_code: string }>("SELECT seat_code FROM bookings WHERE event_id = $1", [
    eventId,
  ]);
  return rows.map((r) => r.seat_code);
}

export async function getBookings(eventId: number): Promise<Booking[]> {
  const { rows } = await pool.query<Booking>(
    `SELECT ${BOOKING_COLUMNS} FROM bookings WHERE event_id = $1 ORDER BY created_at DESC, id`,
    [eventId],
  );
  return rows;
}

export async function getGroup(groupId: string): Promise<Booking[]> {
  const { rows } = await pool.query<Booking>(
    `SELECT ${BOOKING_COLUMNS} FROM bookings WHERE group_id = $1 ORDER BY id`,
    [groupId],
  );
  return rows;
}

// Finds a booking group in an event by the 8-character code printed on the ticket.
export async function findGroupByCode(eventId: number, code: string): Promise<string | null> {
  const { rows } = await pool.query<{ group_id: string }>(
    "SELECT DISTINCT group_id FROM bookings WHERE event_id = $1 AND left(group_id::text, 8) = lower($2)",
    [eventId, code],
  );
  return rows.length === 1 ? rows[0].group_id : null;
}

export async function getWalkIns(eventId: number): Promise<WalkIn[]> {
  const { rows } = await pool.query<WalkIn>(
    "SELECT id, name, phone, created_at FROM walk_ins WHERE event_id = $1 ORDER BY created_at DESC, id DESC",
    [eventId],
  );
  return rows;
}

export type Recap = { registered: number; attended: number; walkIns: number };

export async function getRecap(eventId: number): Promise<Recap> {
  const { rows } = await pool.query<Recap>(
    `SELECT (SELECT count(*) FROM bookings WHERE event_id = $1)::int AS registered,
            (SELECT count(checked_in_at) FROM bookings WHERE event_id = $1)::int AS attended,
            (SELECT count(*) FROM walk_ins WHERE event_id = $1)::int AS "walkIns"`,
    [eventId],
  );
  return rows[0];
}
