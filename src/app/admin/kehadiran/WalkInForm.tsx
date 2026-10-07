"use client";

import { useActionState, useEffect, useState } from "react";
import { addWalkIn, type WalkInState } from "../actions";

const inputCls =
  "w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-base outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/30";

export function WalkInForm() {
  const [state, action, pending] = useActionState<WalkInState, FormData>(addWalkIn, {});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Clear the fields after a successful add, ready for the next person.
  useEffect(() => {
    if (state.added) {
      setName("");
      setPhone("");
    }
  }, [state]);

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Nama</span>
        <input name="name" required minLength={2} maxLength={100} placeholder="Nama lengkap" value={name}
          onChange={(e) => setName(e.target.value)} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Nomor WhatsApp <span className="font-normal text-muted">(opsional)</span>
        </span>
        <input name="phone" type="tel" inputMode="tel" placeholder="0812 3456 7890" value={phone}
          onChange={(e) => setPhone(e.target.value)} className={inputCls} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.added && !pending && (
        <p role="status" className="text-sm text-ok">
          ✓ {state.added} ditambahkan.
        </p>
      )}
      <button type="submit" disabled={pending}
        className="w-full rounded-xl bg-accent py-2.5 font-bold text-accent-ink transition active:scale-[0.98] disabled:opacity-60">
        {pending ? "Menyimpan…" : "Tambah walk-in"}
      </button>
    </form>
  );
}
