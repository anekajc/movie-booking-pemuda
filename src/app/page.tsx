import { event } from "@/config/event";
import { getTakenSeats } from "@/lib/db";
import { totalSeats, isBookableSeat } from "@/lib/seats";
import { SeatPicker } from "@/components/SeatPicker";
import { EventInfo } from "@/components/EventInfo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const taken = (await getTakenSeats()).filter(isBookableSeat);
  const available = totalSeats - taken.length;

  return (
    <main className="mx-auto max-w-lg px-4 pt-8 pb-32">
      <header className="mb-6 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">{event.title}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-balance">{event.movie}</h1>
        <div className="mt-5 rounded-2xl border border-line bg-surface/60 px-3 py-3">
          <EventInfo compact />
        </div>
      </header>

      <p className="mb-3 text-center text-sm text-muted">Pilih satu kursi untuk dirimu sendiri.</p>
      <SeatPicker takenSeats={taken} available={available} />
    </main>
  );
}
