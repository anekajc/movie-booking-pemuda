import Link from "next/link";
import { maxSeatsPerBooking } from "@/config/event";
import { getTakenSeats } from "@/lib/db";
import { getSettings, formatEventDate, formatEventTime } from "@/lib/settings";
import { isBookableSeat, layoutFor, sortSeats } from "@/lib/seats";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Isi Data Pemesan" };

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ seats?: string; seat?: string }>;
}) {
  const sp = await searchParams;
  const settings = await getSettings();
  const layout = layoutFor(settings);

  const seats = sortSeats([
    ...new Set(
      String(sp.seats ?? sp.seat ?? "")
        .toUpperCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ]);
  const takenSet = new Set(await getTakenSeats());
  const invalid = seats.length === 0 || seats.length > maxSeatsPerBooking || !seats.every((s) => isBookableSeat(layout, s));
  const taken = invalid ? [] : seats.filter((s) => takenSet.has(s));

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link href="/" className="text-sm text-muted transition hover:text-text">
        ← Ganti kursi
      </Link>

      {invalid || taken.length > 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-lg font-semibold">
            {invalid ? "Pilihan kursi tidak valid." : `Maaf, kursi ${taken.join(", ")} sudah diambil.`}
          </p>
          <p className="mt-2 text-sm text-muted">Silakan kembali dan pilih kursi yang masih tersedia.</p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-accent-ink">
            Lihat denah kursi
          </Link>
        </div>
      ) : (
        <>
          <header className="mt-6 mb-6">
            <p className="text-xs tracking-wider text-muted uppercase">
              {seats.length > 1 ? `${seats.length} kursi pilihanmu` : "Kursi pilihanmu"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {seats.map((s) => (
                <span
                  key={s}
                  className="grid h-12 min-w-14 place-items-center rounded-xl bg-accent px-3 text-xl font-extrabold text-accent-ink"
                >
                  {s}
                </span>
              ))}
            </div>
            <h1 className="mt-4 text-xl font-bold">{settings.movieTitle}</h1>
            <p className="text-sm text-muted">
              {formatEventDate(settings.eventDate)} · {formatEventTime(settings.eventTime)}
            </p>
          </header>
          <BookingForm seats={seats} />
        </>
      )}
    </main>
  );
}
