import { blockedSeats } from "@/config/event";

// Plain, serializable description of the seat grid (safe to pass to client components).
export type SeatLayout = {
  rowLabels: string[];
  seatsPerRow: number;
  aisleAfter: number | null;
  blocked: string[];
};

export function layoutFor({ rows, seatsPerRow }: { rows: number; seatsPerRow: number }): SeatLayout {
  return {
    rowLabels: Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i)),
    seatsPerRow,
    // Middle aisle once rows are wide enough to need one.
    aisleAfter: seatsPerRow >= 6 ? Math.ceil(seatsPerRow / 2) : null,
    blocked: blockedSeats.map((s) => s.toUpperCase()),
  };
}

export function seatsInRow(layout: SeatLayout, row: string) {
  return Array.from({ length: layout.seatsPerRow }, (_, i) => `${row}${i + 1}`);
}

export function allSeats(layout: SeatLayout) {
  return layout.rowLabels.flatMap((r) => seatsInRow(layout, r));
}

export function isBlocked(layout: SeatLayout, code: string) {
  return layout.blocked.includes(code);
}

export function isBookableSeat(layout: SeatLayout, code: string) {
  const m = /^([A-Z])(\d{1,2})$/.exec(code);
  if (!m) return false;
  const n = Number(m[2]);
  return layout.rowLabels.includes(m[1]) && n >= 1 && n <= layout.seatsPerRow && !isBlocked(layout, code);
}

export function bookableCount(layout: SeatLayout) {
  return allSeats(layout).filter((s) => !isBlocked(layout, s)).length;
}

// "C10", "A2", "C5" -> "A2", "C5", "C10"
export function sortSeats(seats: string[]) {
  return [...seats].sort((a, b) => a[0].localeCompare(b[0]) || Number(a.slice(1)) - Number(b.slice(1)));
}
