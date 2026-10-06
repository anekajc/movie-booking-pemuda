"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { checkPassword, createSessionToken, isAdmin, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
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
  redirect("/admin");
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
