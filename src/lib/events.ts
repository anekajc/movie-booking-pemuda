import "server-only";
import { cache } from "react";
import { timeZoneLabel } from "@/config/event";
import { pool } from "./db";

export type EventSettings = {
  id: number;
  fellowshipTitle: string;
  movieTitle: string;
  location: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // HH:MM
  rows: number;
  seatsPerRow: number;
  archivedAt: Date | null;
};

const COLUMNS =
  "id, fellowship_title, movie_title, location, event_date, event_time, seat_rows, seats_per_row, archived_at";

type EventRow = {
  id: number;
  fellowship_title: string;
  movie_title: string;
  location: string;
  event_date: string;
  event_time: string;
  seat_rows: number;
  seats_per_row: number;
  archived_at: Date | null;
};

function toEvent(r: EventRow): EventSettings {
  return {
    id: r.id,
    fellowshipTitle: r.fellowship_title,
    movieTitle: r.movie_title,
    location: r.location,
    eventDate: r.event_date,
    eventTime: String(r.event_time).slice(0, 5),
    rows: r.seat_rows,
    seatsPerRow: r.seats_per_row,
    archivedAt: r.archived_at,
  };
}

// The event guests are booking for right now. Cached per request.
export const getActiveEvent = cache(async (): Promise<EventSettings> => {
  const { rows } = await pool.query<EventRow>(`SELECT ${COLUMNS} FROM events WHERE archived_at IS NULL`);
  if (!rows[0]) throw new Error("No active event found. Run the migration: npm run migrate");
  return toEvent(rows[0]);
});

export const getEvent = cache(async (id: number): Promise<EventSettings | null> => {
  const { rows } = await pool.query<EventRow>(`SELECT ${COLUMNS} FROM events WHERE id = $1`, [id]);
  return rows[0] ? toEvent(rows[0]) : null;
});

export type ArchivedEvent = EventSettings & { registered: number; attended: number; walkIns: number };

export async function getArchivedEvents(): Promise<ArchivedEvent[]> {
  const { rows } = await pool.query<EventRow & { registered: number; attended: number; walk_ins: number }>(
    `SELECT ${COLUMNS},
            (SELECT count(*) FROM bookings b WHERE b.event_id = e.id)::int AS registered,
            (SELECT count(b.checked_in_at) FROM bookings b WHERE b.event_id = e.id)::int AS attended,
            (SELECT count(*) FROM walk_ins w WHERE w.event_id = e.id)::int AS walk_ins
       FROM events e
      WHERE archived_at IS NOT NULL
      ORDER BY event_date DESC, id DESC`,
  );
  return rows.map((r) => ({ ...toEvent(r), registered: r.registered, attended: r.attended, walkIns: r.walk_ins }));
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// "2026-10-17" -> "Sabtu, 17 Oktober 2026"
export function formatEventDate(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? date : dateFmt.format(d);
}

// "18:30" -> "18.30 WIB"
export function formatEventTime(time: string) {
  return `${time.replace(":", ".")} ${timeZoneLabel}`;
}

const stampFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const clockFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });

// "7 Okt, 19.05"
export const formatStamp = (d: Date) => stampFmt.format(d);
// "19.05"
export const formatClock = (d: Date) => clockFmt.format(d);
