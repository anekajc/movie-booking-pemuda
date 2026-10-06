"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createBooking, type BookingState } from "./actions";

const inputCls =
  "w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/30";

export function BookingForm({ seat }: { seat: string }) {
  const [state, action, pending] = useActionState<BookingState, FormData>(createBooking, {});
  // Controlled so values survive a failed submit.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="seat" value={seat} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Nama</span>
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          placeholder="Nama lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Nomor WhatsApp</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          placeholder="0812 3456 7890"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputCls}
        />
        <span className="mt-1.5 block text-xs text-muted">Kami akan menghubungimu lewat WhatsApp bila perlu.</span>
      </label>

      {state.error && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
          {state.seatTaken && (
            <Link href="/" className="mt-2 block font-semibold underline underline-offset-2">
              ← Pilih kursi lain
            </Link>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent py-3.5 text-base font-bold text-accent-ink transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Memproses…" : `Pesan Kursi ${seat}`}
      </button>
    </form>
  );
}
