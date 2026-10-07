import { Pool, types } from "pg";

// Keep DATE columns as "YYYY-MM-DD" strings instead of local-midnight Date objects.
types.setTypeParser(types.builtins.DATE, (v) => v);

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export type Booking = {
  id: number;
  group_id: string;
  seat_code: string;
  name: string;
  phone: string;
  created_at: Date;
};

export async function getTakenSeats(): Promise<string[]> {
  const { rows } = await pool.query<{ seat_code: string }>("SELECT seat_code FROM bookings");
  return rows.map((r) => r.seat_code);
}

export async function getBookings(): Promise<Booking[]> {
  const { rows } = await pool.query<Booking>(
    "SELECT id, group_id, seat_code, name, phone, created_at FROM bookings ORDER BY created_at DESC, id",
  );
  return rows;
}

export async function getGroup(groupId: string): Promise<Booking[]> {
  const { rows } = await pool.query<Booking>(
    "SELECT id, group_id, seat_code, name, phone, created_at FROM bookings WHERE group_id = $1 ORDER BY id",
    [groupId],
  );
  return rows;
}
