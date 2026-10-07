"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { maxSeatsPerBooking } from "@/config/event";
import { pool } from "@/lib/db";
import { getLayout } from "@/lib/settings";
import { isBookableSeat } from "@/lib/seats";
import { formatPhone, normalizePhone } from "@/lib/phone";

export type BookingState = {
  error?: string;
  // Per-seat field errors, keyed by seat code.
  seatErrors?: Record<string, string>;
  // True when the chosen seats are no longer available; the form then offers a link back to the map.
  reselect?: boolean;
};

export async function createBooking(_prev: BookingState, formData: FormData): Promise<BookingState> {
  const layout = await getLayout();
  const seats = formData.getAll("seat").map((v) => String(v).toUpperCase());
  const names = formData.getAll("name").map((v) => String(v).trim().replace(/\s+/g, " "));
  const phones = formData.getAll("phone").map((v) => normalizePhone(String(v)));

  if (
    seats.length === 0 ||
    seats.length > maxSeatsPerBooking ||
    new Set(seats).size !== seats.length ||
    names.length !== seats.length ||
    phones.length !== seats.length ||
    !seats.every((s) => isBookableSeat(layout, s))
  ) {
    return { error: "Pilihan kursi tidak valid. Silakan pilih ulang.", reselect: true };
  }

  const seatErrors: Record<string, string> = {};
  seats.forEach((seat, i) => {
    if (names[i].length < 2 || names[i].length > 100) seatErrors[seat] = "Mohon isi nama lengkap.";
    else if (!phones[i]) seatErrors[seat] = "Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890";
  });
  if (Object.keys(seatErrors).length) return { error: "Periksa kembali data di bawah.", seatErrors };

  const people = seats.map((seat, i) => ({ seat, name: names[i], phone: phones[i]! }));
  const groupId = randomUUID();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // A phone number may repeat inside this booking (e.g. a family), but must not
    // already belong to another booking. Lock each number so concurrent bookings
    // with the same number are checked one at a time.
    const uniquePhones = [...new Set(people.map((p) => p.phone))].sort();
    for (const phone of uniquePhones) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [phone]);
    }
    const { rows: used } = await client.query<{ phone: string; seat_code: string }>(
      "SELECT phone, seat_code FROM bookings WHERE phone = ANY($1) ORDER BY seat_code",
      [uniquePhones],
    );
    if (used.length) {
      await client.query("ROLLBACK");
      for (const p of people) {
        const prev = used.filter((u) => u.phone === p.phone).map((u) => u.seat_code);
        if (prev.length)
          seatErrors[p.seat] = `Nomor ${formatPhone(p.phone)} sudah terdaftar di pesanan lain (kursi ${prev.join(", ")}).`;
      }
      return { error: "Ada nomor WhatsApp yang sudah pernah dipakai.", seatErrors };
    }

    for (const p of people) {
      await client.query("INSERT INTO bookings (group_id, seat_code, name, phone) VALUES ($1, $2, $3, $4)", [
        groupId,
        p.seat,
        p.name,
        p.phone,
      ]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if ((err as { code?: string }).code === "23505") {
      const { rows } = await pool.query<{ seat_code: string }>(
        "SELECT seat_code FROM bookings WHERE seat_code = ANY($1) ORDER BY seat_code",
        [seats],
      );
      const lost = rows.map((r) => r.seat_code).join(", ") || "yang kamu pilih";
      return { error: `Maaf, kursi ${lost} baru saja diambil orang lain. Silakan pilih ulang.`, reselect: true };
    }
    console.error("createBooking failed", err);
    return { error: "Terjadi kesalahan. Coba lagi sebentar lagi." };
  } finally {
    client.release();
  }

  redirect(`/sukses?g=${groupId}`);
}
