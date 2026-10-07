"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createBooking, type BookingState } from "./actions";

const inputCls =
  "w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/30";

type Person = { name: string; phone: string };

export function BookingForm({ seats }: { seats: string[] }) {
  const [state, action, pending] = useActionState<BookingState, FormData>(createBooking, {});
  // Controlled so values survive a failed submit.
  const [people, setPeople] = useState<Person[]>(() => seats.map(() => ({ name: "", phone: "" })));
  const multi = seats.length > 1;

  function update(i: number, patch: Partial<Person>) {
    setPeople((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  return (
    <form action={action} className="space-y-4">
      {seats.map((seat, i) => {
        const err = state.seatErrors?.[seat];
        return (
          <fieldset
            key={seat}
            className={`rounded-2xl border bg-surface p-5 ${err ? "border-danger/60" : "border-line"}`}
          >
            <legend className="sr-only">Data untuk kursi {seat}</legend>
            <input type="hidden" name="seat" value={seat} />

            {multi && (
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-9 min-w-11 place-items-center rounded-lg bg-accent px-2 text-sm font-extrabold text-accent-ink">
                  {seat}
                </span>
                <span className="text-sm text-muted">Orang ke-{i + 1}</span>
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Nama</span>
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete={i === 0 ? "name" : "off"}
                  placeholder="Nama lengkap"
                  value={people[i].name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className={inputCls}
                />
              </label>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor={`phone-${seat}`} className="text-sm font-medium">
                    Nomor WhatsApp
                  </label>
                  {i > 0 && people[0].phone && people[i].phone !== people[0].phone && (
                    <button
                      type="button"
                      onClick={() => update(i, { phone: people[0].phone })}
                      className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
                    >
                      Sama dengan orang ke-1
                    </button>
                  )}
                </div>
                <input
                  id={`phone-${seat}`}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete={i === 0 ? "tel" : "off"}
                  placeholder="0812 3456 7890"
                  value={people[i].phone}
                  onChange={(e) => update(i, { phone: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {err && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {err}
              </p>
            )}
          </fieldset>
        );
      })}

      {multi && (
        <p className="px-1 text-xs text-muted">
          Nomor WhatsApp boleh sama dalam satu pesanan (misalnya untuk anak-anak).
        </p>
      )}

      {state.error && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
          {state.reselect && (
            <Link href="/" className="mt-2 block font-semibold underline underline-offset-2">
              ← Pilih ulang kursi
            </Link>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent py-3.5 text-base font-bold text-accent-ink transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Memproses…" : multi ? `Pesan ${seats.length} Kursi` : `Pesan Kursi ${seats[0]}`}
      </button>
    </form>
  );
}
