import Link from "next/link";
import { event } from "@/config/event";
import { isSeatTaken } from "@/lib/db";
import { isBookableSeat } from "@/lib/seats";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ seat?: string }> }) {
  const seat = String((await searchParams).seat ?? "").toUpperCase();
  const valid = isBookableSeat(seat);
  const taken = valid && (await isSeatTaken(seat));

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link href="/" className="text-sm text-muted transition hover:text-text">
        ← Ganti kursi
      </Link>

      {!valid || taken ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-lg font-semibold">
            {valid ? `Maaf, kursi ${seat} sudah diambil.` : "Kursi tidak ditemukan."}
          </p>
          <p className="mt-2 text-sm text-muted">Silakan kembali dan pilih kursi lain yang masih tersedia.</p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-accent-ink">
            Lihat denah kursi
          </Link>
        </div>
      ) : (
        <>
          <header className="mt-6 mb-6 flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-accent text-2xl font-extrabold text-accent-ink">
              {seat}
            </div>
            <div>
              <p className="text-xs tracking-wider text-muted uppercase">Kursi pilihanmu</p>
              <h1 className="text-xl font-bold">{event.movie}</h1>
              <p className="text-sm text-muted">
                {event.date} · {event.time}
              </p>
            </div>
          </header>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <BookingForm seat={seat} />
          </div>
        </>
      )}
    </main>
  );
}
