"use client";

import { useActionState, useMemo, useState } from "react";
import { gridLimits } from "@/config/event";
import { bookableCount, layoutFor } from "@/lib/seats";
import type { EventSettings } from "@/lib/events";
import { SeatMap } from "@/components/SeatMap";
import { updateSettings, type SettingsState } from "../actions";

const inputCls =
  "w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30";

export function SettingsForm({ settings, bookedSeats }: { settings: EventSettings; bookedSeats: string[] }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSettings, {});
  // Controlled so values survive both failed and successful submits.
  const [v, setV] = useState(settings);
  const set = (patch: Partial<EventSettings>) => setV((prev) => ({ ...prev, ...patch }));

  const rows = Math.min(Math.max(Math.trunc(v.rows) || 0, 0), gridLimits.maxRows);
  const perRow = Math.min(Math.max(Math.trunc(v.seatsPerRow) || 0, 0), gridLimits.maxSeatsPerRow);
  const layout = useMemo(() => layoutFor({ rows, seatsPerRow: perRow }), [rows, perRow]);
  const taken = useMemo(() => new Set(bookedSeats), [bookedSeats]);

  const field = (label: string, input: React.ReactNode, hint?: string) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {input}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Detail Acara</h2>
        {field(
          "Nama persekutuan",
          <input name="fellowshipTitle" required maxLength={100} value={v.fellowshipTitle}
            onChange={(e) => set({ fellowshipTitle: e.target.value })} className={inputCls} />,
        )}
        {field(
          "Judul film",
          <input name="movieTitle" required maxLength={100} value={v.movieTitle}
            onChange={(e) => set({ movieTitle: e.target.value })} className={inputCls} />,
        )}
        <div className="grid grid-cols-2 gap-3">
          {field(
            "Tanggal",
            <input name="eventDate" type="date" required value={v.eventDate}
              onChange={(e) => set({ eventDate: e.target.value })} className={inputCls} />,
          )}
          {field(
            "Jam",
            <input name="eventTime" type="time" required value={v.eventTime}
              onChange={(e) => set({ eventTime: e.target.value })} className={inputCls} />,
          )}
        </div>
        {field(
          "Tempat",
          <input name="location" required maxLength={100} value={v.location}
            onChange={(e) => set({ location: e.target.value })} className={inputCls} />,
        )}

        <h2 className="pt-2 font-semibold">Denah Kursi</h2>
        <div className="grid grid-cols-2 gap-3">
          {field(
            "Jumlah baris",
            <input name="rows" type="number" required min={1} max={gridLimits.maxRows} value={v.rows || ""}
              onChange={(e) => set({ rows: Number(e.target.value) })} className={inputCls} />,
            `A–${String.fromCharCode(64 + Math.max(rows, 1))}, maks. ${gridLimits.maxRows}`,
          )}
          {field(
            "Kursi per baris",
            <input name="seatsPerRow" type="number" required min={1} max={gridLimits.maxSeatsPerRow}
              value={v.seatsPerRow || ""} onChange={(e) => set({ seatsPerRow: Number(e.target.value) })}
              className={inputCls} />,
            `maks. ${gridLimits.maxSeatsPerRow}`,
          )}
        </div>
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
          {rows} × {perRow} = <span className="font-bold text-accent">{bookableCount(layout)} kursi</span>
          {layout.aisleAfter && <span className="text-muted"> · lorong setelah kursi {layout.aisleAfter}</span>}
        </p>

        {state.error && (
          <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {state.error}
          </div>
        )}
        {state.ok && !pending && (
          <p role="status" className="rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-ok">
            Pengaturan tersimpan.
          </p>
        )}

        <button type="submit" disabled={pending}
          className="w-full rounded-xl bg-accent py-3 font-bold text-accent-ink transition active:scale-[0.98] disabled:opacity-60">
          {pending ? "Menyimpan…" : "Simpan Pengaturan"}
        </button>
      </section>

      <aside className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Pratinjau Denah</h2>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="size-3 rounded-t-sm rounded-b-xs bg-accent" /> Terisi
          </span>
        </div>
        <div className="mx-auto mb-3 w-4/5">
          <div className="screen" />
        </div>
        {rows > 0 && perRow > 0 ? (
          <SeatMap layout={layout} taken={taken} size="sm" />
        ) : (
          <p className="py-6 text-center text-sm text-muted">Isi jumlah baris dan kursi.</p>
        )}
      </aside>
    </form>
  );
}
