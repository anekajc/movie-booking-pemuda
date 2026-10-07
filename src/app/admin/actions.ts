"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { gridLimits } from "@/config/event";
import { pool } from "@/lib/db";
import { allSeats, layoutFor, sortSeats } from "@/lib/seats";
import { checkPassword, createSessionToken, isAdmin, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "Password salah." };
  }
  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin");
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

export async function deleteBooking(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
  revalidatePath("/admin");
}

export async function resetAll() {
  await requireAdmin();
  await pool.query("DELETE FROM bookings");
  revalidatePath("/admin");
}

export type SettingsState = { error?: string; ok?: boolean };

export async function updateSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin();
  const text = (key: string) => String(formData.get(key) ?? "").trim().replace(/\s+/g, " ");
  const int = (key: string) => Number(formData.get(key));

  const fellowshipTitle = text("fellowshipTitle");
  const movieTitle = text("movieTitle");
  const location = text("location");
  const eventDate = text("eventDate");
  const eventTime = text("eventTime");
  const rows = int("rows");
  const seatsPerRow = int("seatsPerRow");

  for (const [label, v] of [
    ["Nama persekutuan", fellowshipTitle],
    ["Judul film", movieTitle],
    ["Tempat", location],
  ] as const) {
    if (!v || v.length > 100) return { error: `${label} wajib diisi (maks. 100 karakter).` };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(Date.parse(eventDate)))
    return { error: "Tanggal tidak valid." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)) return { error: "Jam tidak valid." };
  if (!Number.isInteger(rows) || rows < 1 || rows > gridLimits.maxRows)
    return { error: `Jumlah baris harus 1–${gridLimits.maxRows}.` };
  if (!Number.isInteger(seatsPerRow) || seatsPerRow < 1 || seatsPerRow > gridLimits.maxSeatsPerRow)
    return { error: `Kursi per baris harus 1–${gridLimits.maxSeatsPerRow}.` };

  // Refuse a smaller grid that would leave booked seats outside the map.
  const newSeats = new Set(allSeats(layoutFor({ rows, seatsPerRow })));
  const { rows: booked } = await pool.query<{ seat_code: string }>("SELECT seat_code FROM bookings");
  const outside = sortSeats(booked.map((b) => b.seat_code).filter((s) => !newSeats.has(s)));
  if (outside.length) {
    return {
      error: `Kursi ${outside.join(", ")} sudah dipesan dan berada di luar denah baru. Hapus dulu pendaftarnya, atau perbesar denah.`,
    };
  }

  await pool.query(
    `INSERT INTO settings (id, fellowship_title, movie_title, location, event_date, event_time, seat_rows, seats_per_row, updated_at)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (id) DO UPDATE SET
       fellowship_title = EXCLUDED.fellowship_title, movie_title = EXCLUDED.movie_title,
       location = EXCLUDED.location, event_date = EXCLUDED.event_date, event_time = EXCLUDED.event_time,
       seat_rows = EXCLUDED.seat_rows, seats_per_row = EXCLUDED.seats_per_row, updated_at = now()`,
    [fellowshipTitle, movieTitle, location, eventDate, eventTime, rows, seatsPerRow],
  );
  revalidatePath("/", "layout");
  return { ok: true };
}
