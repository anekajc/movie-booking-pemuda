"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { maxSeatsPerBooking } from "@/config/event";
import { sortSeats, type SeatLayout } from "@/lib/seats";
import { SeatMap, SeatLegend } from "./SeatMap";

const REFRESH_MS = 15_000;

export function SeatPicker({
  layout,
  takenSeats,
  available,
}: {
  layout: SeatLayout;
  takenSeats: string[];
  available: number;
}) {
  const router = useRouter();
  const taken = useMemo(() => new Set(takenSeats), [takenSeats]);
  const [selected, setSelected] = useState<string[]>([]);
  const [limitHit, setLimitHit] = useState(false);

  // Keep the map fresh so people don't pick seats that were just taken.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    if (!limitHit) return;
    const id = setTimeout(() => setLimitHit(false), 2500);
    return () => clearTimeout(id);
  }, [limitHit]);

  const current = sortSeats(selected.filter((s) => !taken.has(s)));

  function toggle(seat: string) {
    if (current.includes(seat)) return setSelected(current.filter((s) => s !== seat));
    if (current.length >= maxSeatsPerBooking) return setLimitHit(true);
    setSelected([...current, seat]);
  }

  return (
    <>
      <section className="rounded-2xl border border-line bg-surface/80 px-3 pt-6 pb-5">
        <div className="mx-auto mb-1 w-4/5">
          <div className="screen" />
        </div>
        <p className="mb-6 text-center text-[10px] font-semibold tracking-[0.4em] text-muted">LAYAR</p>

        <SeatMap layout={layout} taken={taken} selected={current} onSelect={toggle} />

        <div className="mt-6">
          <SeatLegend />
        </div>
      </section>

      <p className="mt-4 text-center text-sm text-muted">
        {available > 0 ? (
          <>
            <span className="font-semibold text-text">{available}</span> kursi tersisa
          </>
        ) : (
          <span className="font-semibold text-danger">Maaf, semua kursi sudah penuh.</span>
        )}
      </p>

      {/* Sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <p className={`text-xs ${limitHit ? "font-semibold text-danger" : "text-muted"}`} aria-live="polite">
              {limitHit
                ? `Maksimal ${maxSeatsPerBooking} kursi per pesanan`
                : current.length > 0
                  ? `${current.length} kursi dipilih`
                  : "Kursi dipilih"}
            </p>
            <p className="truncate text-xl font-bold text-accent">{current.length ? current.join(", ") : "—"}</p>
          </div>
          {current.length > 0 ? (
            <Link
              href={`/booking?seats=${current.join(",")}`}
              className="shrink-0 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-ink transition active:scale-95"
            >
              Lanjut →
            </Link>
          ) : (
            <span className="shrink-0 rounded-xl bg-surface-2 px-6 py-3 font-semibold text-muted">Pilih kursi</span>
          )}
        </div>
      </div>
    </>
  );
}
