"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { gridLimits } from "@/config/event";
import { pool } from "@/lib/db";
import { getActiveEvent } from "@/lib/events";
import { normalizePhone } from "@/lib/phone";
import { allSeats, layoutFor, sortSeats } from "@/lib/seats";
import { UUID_RE } from "@/lib/ticket";
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

const clean = (v: FormDataEntryValue | null) => String(v ?? "").trim().replace(/\s+/g, " ");

export async function deleteBooking(formData: FormData) {
  await requireAdmin();
  const event = await getActiveEvent();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) await pool.query("DELETE FROM bookings WHERE id = $1 AND event_id = $2", [id, event.id]);
  revalidatePath("/admin");
}

// Archives the active event (bookings and attendance are kept for Riwayat) and starts
// a new one with the same details one week later, ready to be edited.
export async function archiveAndStartNew() {
  await requireAdmin();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "UPDATE events SET archived_at = now() WHERE archived_at IS NULL RETURNING *",
    );
    const old = rows[0];
    if (old) {
      await client.query(
        `INSERT INTO events (fellowship_title, movie_title, location, event_date, event_time, seat_rows, seats_per_row)
         VALUES ($1, $2, $3, $4::date + 7, $5, $6, $7)`,
        [old.fellowship_title, old.movie_title, old.location, old.event_date, old.event_time, old.seat_rows, old.seats_per_row],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  redirect("/admin/pengaturan?baru=1");
}

export type SettingsState = { error?: string; ok?: boolean };

export async function updateSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin();
  const event = await getActiveEvent();
  const int = (key: string) => Number(formData.get(key));

  const fellowshipTitle = clean(formData.get("fellowshipTitle"));
  const movieTitle = clean(formData.get("movieTitle"));
  const location = clean(formData.get("location"));
  const eventDate = clean(formData.get("eventDate"));
  const eventTime = clean(formData.get("eventTime"));
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
  const { rows: booked } = await pool.query<{ seat_code: string }>(
    "SELECT seat_code FROM bookings WHERE event_id = $1",
    [event.id],
  );
  const outside = sortSeats(booked.map((b) => b.seat_code).filter((s) => !newSeats.has(s)));
  if (outside.length) {
    return {
      error: `Kursi ${outside.join(", ")} sudah dipesan dan berada di luar denah baru. Hapus dulu pendaftarnya, atau perbesar denah.`,
    };
  }

  await pool.query(
    `UPDATE events SET fellowship_title = $2, movie_title = $3, location = $4, event_date = $5,
            event_time = $6, seat_rows = $7, seats_per_row = $8
      WHERE id = $1`,
    [event.id, fellowshipTitle, movieTitle, location, eventDate, eventTime, rows, seatsPerRow],
  );
  revalidatePath("/", "layout");
  return { ok: true };
}

// Saves who in a booking actually came. Unticked people are marked as not present.
export async function setAttendance(formData: FormData) {
  await requireAdmin();
  const event = await getActiveEvent();
  const groupId = String(formData.get("groupId") ?? "");
  if (!UUID_RE.test(groupId)) redirect("/admin/kehadiran");

  const present = formData
    .getAll("present")
    .map(Number)
    .filter(Number.isInteger);

  await pool.query(
    `UPDATE bookings
        SET checked_in_at = CASE WHEN id = ANY($3::int[]) THEN COALESCE(checked_in_at, now()) ELSE NULL END
      WHERE group_id = $1 AND event_id = $2`,
    [groupId, event.id, present],
  );
  revalidatePath("/admin", "layout");
  redirect(`/admin/kehadiran?ok=${groupId}`);
}

export type WalkInState = { error?: string; added?: string };

export async function addWalkIn(_prev: WalkInState, formData: FormData): Promise<WalkInState> {
  await requireAdmin();
  const event = await getActiveEvent();
  const name = clean(formData.get("name"));
  const rawPhone = clean(formData.get("phone"));
  const phone = rawPhone ? normalizePhone(rawPhone) : null;

  if (name.length < 2 || name.length > 100) return { error: "Mohon isi nama (min. 2 huruf)." };
  if (rawPhone && !phone) return { error: "Nomor WhatsApp tidak valid. Kosongkan bila tidak ada." };

  await pool.query("INSERT INTO walk_ins (event_id, name, phone) VALUES ($1, $2, $3)", [event.id, name, phone]);
  revalidatePath("/admin", "layout");
  return { added: name };
}

export async function deleteWalkIn(formData: FormData) {
  await requireAdmin();
  const event = await getActiveEvent();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) await pool.query("DELETE FROM walk_ins WHERE id = $1 AND event_id = $2", [id, event.id]);
  revalidatePath("/admin", "layout");
}
