import "server-only";
import { cache } from "react";
import { defaultSettings, timeZoneLabel } from "@/config/event";
import { pool } from "./db";
import { layoutFor } from "./seats";

export type EventSettings = typeof defaultSettings;

// Cached per request, so pages and generateMetadata share one query.
export const getSettings = cache(async (): Promise<EventSettings> => {
  const { rows } = await pool.query(
    `SELECT fellowship_title, movie_title, location, event_date, event_time, seat_rows, seats_per_row
       FROM settings WHERE id = 1`,
  );
  const r = rows[0];
  if (!r) return defaultSettings;
  return {
    fellowshipTitle: r.fellowship_title,
    movieTitle: r.movie_title,
    location: r.location,
    eventDate: r.event_date,
    eventTime: String(r.event_time).slice(0, 5),
    rows: r.seat_rows,
    seatsPerRow: r.seats_per_row,
  };
});

export async function getLayout() {
  return layoutFor(await getSettings());
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
