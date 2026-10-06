import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export type Booking = {
  id: number;
  seat_code: string;
  name: string;
  phone: string;
  created_at: Date;
};

export async function getTakenSeats(): Promise<string[]> {
  const { rows } = await pool.query<{ seat_code: string }>("SELECT seat_code FROM bookings");
  return rows.map((r) => r.seat_code);
}

export async function isSeatTaken(seat: string) {
  const { rowCount } = await pool.query("SELECT 1 FROM bookings WHERE seat_code = $1", [seat]);
  return (rowCount ?? 0) > 0;
}

export async function getBookings(): Promise<Booking[]> {
  const { rows } = await pool.query<Booking>(
    "SELECT id, seat_code, name, phone, created_at FROM bookings ORDER BY created_at DESC",
  );
  return rows;
}
