"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SeatMap, SeatLegend } from "./SeatMap";

const REFRESH_MS = 15_000;

export function SeatPicker({ takenSeats, available }: { takenSeats: string[]; available: number }) {
  const router = useRouter();
  const taken = useMemo(() => new Set(takenSeats), [takenSeats]);
  const [selected, setSelected] = useState<string | null>(null);

  // Keep the map fresh so people don't pick seats that were just taken.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  const current = selected && !taken.has(selected) ? selected : null;

  return (
    <>
      <section className="rounded-2xl border border-line bg-surface/80 px-3 pt-6 pb-5">
        <div className="mx-auto mb-1 w-4/5">
          <div className="screen" />
        </div>
        <p className="mb-6 text-center text-[10px] font-semibold tracking-[0.4em] text-muted">LAYAR</p>

        <SeatMap taken={taken} selected={current} onSelect={(s) => setSelected(s === current ? null : s)} />

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
          <div>
            <p className="text-xs text-muted">Kursi dipilih</p>
            <p className="text-xl font-bold text-accent">{current ?? "—"}</p>
          </div>
          {current ? (
            <Link
              href={`/booking?seat=${current}`}
              className="rounded-xl bg-accent px-6 py-3 font-semibold text-accent-ink transition active:scale-95"
            >
              Lanjut →
            </Link>
          ) : (
            <span className="rounded-xl bg-surface-2 px-6 py-3 font-semibold text-muted">Pilih kursi</span>
          )}
        </div>
      </div>
    </>
  );
}
