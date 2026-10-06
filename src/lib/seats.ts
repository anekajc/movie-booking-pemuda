import { seating } from "@/config/event";

export type SeatRow = { label: string; seats: string[] };

export const seatRows: SeatRow[] = seating.rows.map((label) => ({
  label,
  seats: Array.from({ length: seating.seatsPerRow }, (_, i) => `${label}${i + 1}`),
}));

const blocked = new Set(seating.blocked.map((s) => s.toUpperCase()));
const allSeats = seatRows.flatMap((r) => r.seats);
const bookable = new Set(allSeats.filter((s) => !blocked.has(s)));

export const totalSeats = bookable.size;

export function isBlocked(code: string) {
  return blocked.has(code);
}

export function isBookableSeat(code: string) {
  return bookable.has(code);
}

export function hasAisleAfter(seatNumber: number) {
  return seating.aisleAfter.includes(seatNumber);
}
