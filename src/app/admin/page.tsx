import type { Metadata } from "next";
import { event, whatsappReminder } from "@/config/event";
import { isAdmin } from "@/lib/auth";
import { getBookings } from "@/lib/db";
import { totalSeats, isBookableSeat } from "@/lib/seats";
import { formatPhone, waLink } from "@/lib/phone";
import { SeatMap } from "@/components/SeatMap";
import { LoginForm } from "./LoginForm";
import { ConfirmButton } from "./ConfirmButton";
import { deleteBooking, logout, resetAll } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const timeFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminPage() {
  if (!(await isAdmin())) return <LoginForm />;

  const bookings = await getBookings();
  const taken = new Set(bookings.map((b) => b.seat_code));
  const registered = bookings.filter((b) => isBookableSeat(b.seat_code)).length;

  const stats = [
    { label: "Terdaftar", value: registered, cls: "text-accent" },
    { label: "Kursi tersisa", value: totalSeats - registered, cls: "text-ok" },
    { label: "Total kursi", value: totalSeats, cls: "text-text" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">Admin</p>
          <h1 className="mt-1 text-2xl font-extrabold">{event.movie}</h1>
          <p className="text-sm text-muted">
            {event.date} · {event.time} · {event.location}
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-text">Keluar</button>
        </form>
      </header>

      <section className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface px-4 py-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className={`mt-1 text-3xl font-extrabold tabular-nums ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <section className="rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-semibold">Daftar Pendaftar</h2>
            <span className="text-xs text-muted">{bookings.length} orang</span>
          </div>

          {bookings.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">Belum ada yang mendaftar.</p>
          ) : (
            <ul className="divide-y divide-line">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-10 w-12 shrink-0 place-items-center rounded-lg bg-accent/15 font-bold text-accent">
                    {b.seat_code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.name}</p>
                    <a
                      href={waLink(b.phone, whatsappReminder(b.name, b.seat_code))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-ok underline-offset-2 hover:underline"
                    >
                      {formatPhone(b.phone)} ↗
                    </a>
                  </div>
                  <span className="hidden shrink-0 text-xs text-muted sm:block">{timeFmt.format(b.created_at)}</span>
                  <form action={deleteBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <ConfirmButton
                      message={`Hapus ${b.name} (kursi ${b.seat_code})? Kursi akan tersedia lagi.`}
                      className="rounded-lg border border-danger/40 px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
                    >
                      Hapus
                    </ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Denah Kursi</h2>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span className="size-3 rounded-t-sm rounded-b-xs bg-accent" /> Terisi
              </span>
            </div>
            <div className="mx-auto mb-3 w-4/5">
              <div className="screen" />
            </div>
            <SeatMap taken={taken} size="sm" />
          </section>

          {bookings.length > 0 && (
            <form action={resetAll} className="rounded-2xl border border-danger/30 p-4">
              <p className="text-sm text-muted">Selesai acara? Kosongkan semua kursi untuk acara berikutnya.</p>
              <ConfirmButton
                message={`Hapus SEMUA ${bookings.length} pendaftar? Tindakan ini tidak bisa dibatalkan.`}
                className="mt-3 w-full rounded-lg bg-danger/15 py-2 text-sm font-semibold text-danger hover:bg-danger/25"
              >
                Hapus semua pendaftar
              </ConfirmButton>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
