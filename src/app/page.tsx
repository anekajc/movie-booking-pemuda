import type { Metadata } from "next";
import { maxSeatsPerBooking } from "@/config/event";
import { getTakenSeats } from "@/lib/db";
import { getActiveEvent, formatEventDate } from "@/lib/events";
import { layoutFor, bookableCount, isBookableSeat } from "@/lib/seats";
import { SeatPicker } from "@/components/SeatPicker";
import { EventInfo } from "@/components/EventInfo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getActiveEvent();
  return {
    title: `${s.fellowshipTitle} · ${s.movieTitle}`,
    description: `${formatEventDate(s.eventDate)} · ${s.location}. Pilih kursimu sekarang!`,
  };
}

export default async function Home() {
  const settings = await getActiveEvent();
  const layout = layoutFor(settings);
  const taken = (await getTakenSeats(settings.id)).filter((s) => isBookableSeat(layout, s));
  const available = bookableCount(layout) - taken.length;

  return (
    <main className="mx-auto max-w-lg px-4 pt-8 pb-32">
      <header className="mb-6 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">{settings.fellowshipTitle}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-balance">{settings.movieTitle}</h1>
        <div className="mt-5 rounded-2xl border border-line bg-surface/60 px-3 py-3">
          <EventInfo settings={settings} compact />
        </div>
      </header>

      <p className="mb-3 text-center text-sm text-muted">
        Pilih kursi untuk dirimu, keluarga, atau teman (maks. {maxSeatsPerBooking} kursi).
      </p>
      <SeatPicker layout={layout} takenSeats={taken} available={available} />
    </main>
  );
}
