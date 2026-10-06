"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { isBookableSeat } from "@/lib/seats";
import { normalizePhone } from "@/lib/phone";

export type BookingState = {
  error?: string;
  seatTaken?: boolean;
};

export async function createBooking(_prev: BookingState, formData: FormData): Promise<BookingState> {
  const seat = String(formData.get("seat") ?? "").toUpperCase();
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!isBookableSeat(seat)) return { error: "Kursi tidak valid. Silakan pilih ulang.", seatTaken: true };
  if (name.length < 2 || name.length > 100) return { error: "Mohon isi nama lengkap kamu." };
  if (!phone) return { error: "Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890" };

  try {
    await pool.query("INSERT INTO bookings (seat_code, name, phone) VALUES ($1, $2, $3)", [seat, name, phone]);
  } catch (err) {
    const e = err as { code?: string; constraint?: string };
    if (e.code === "23505" && e.constraint === "bookings_phone_key") {
      const { rows } = await pool.query<{ seat_code: string }>(
        "SELECT seat_code FROM bookings WHERE phone = $1",
        [phone],
      );
      return {
        error: `Nomor ini sudah terdaftar di kursi ${rows[0]?.seat_code ?? "lain"}. Satu nomor hanya bisa memesan satu kursi.`,
      };
    }
    if (e.code === "23505") {
      return { error: `Maaf, kursi ${seat} baru saja diambil orang lain. Silakan pilih kursi lain.`, seatTaken: true };
    }
    console.error("createBooking failed", err);
    return { error: "Terjadi kesalahan. Coba lagi sebentar lagi." };
  }

  redirect(`/sukses?seat=${seat}&name=${encodeURIComponent(name)}`);
}
