import type { Booking, Recap, WalkIn } from "@/lib/db";
import { formatClock } from "@/lib/events";
import { formatPhone, waLink } from "@/lib/phone";
import { sortSeats } from "@/lib/seats";

// Attendance numbers. `live` is for the current event, where "not here" may still change.
export function RecapStats({ recap, live }: { recap: Recap; live?: boolean }) {
  const stats = [
    { label: "Terdaftar", value: recap.registered, cls: "text-text" },
    { label: "Hadir", value: recap.attended, cls: "text-ok" },
    { label: live ? "Belum hadir" : "Tidak hadir", value: recap.registered - recap.attended, cls: "text-muted" },
    { label: "Walk-in", value: recap.walkIns, cls: "text-accent" },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-line bg-surface px-4 py-3">
          <p className="text-xs text-muted">{s.label}</p>
          <p className={`mt-1 text-2xl font-extrabold tabular-nums ${s.cls}`}>{s.value}</p>
        </div>
      ))}
      <div className="col-span-2 rounded-2xl border border-accent/50 bg-accent/10 px-4 py-3 sm:col-span-1">
        <p className="text-xs text-accent">Total hadir</p>
        <p className="mt-1 text-2xl font-extrabold text-accent tabular-nums">{recap.attended + recap.walkIns}</p>
      </div>
    </section>
  );
}

export function DownloadRecap({ eventId }: { eventId: number }) {
  return (
    <a
      href={`/admin/rekap/${eventId}`}
      className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d="M12 3v12m0 0-5-5m5 5 5-5M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Download rekap (Excel)
    </a>
  );
}

// Everyone for an event: registered people (by seat) followed by walk-ins.
export function AttendeeList({ bookings, walkIns }: { bookings: Booking[]; walkIns: WalkIn[] }) {
  const bySeat = sortSeats(bookings.map((b) => b.seat_code)).map((s) => bookings.find((b) => b.seat_code === s)!);
  if (bySeat.length + walkIns.length === 0)
    return <p className="px-4 py-10 text-center text-sm text-muted">Belum ada data.</p>;

  return (
    <ul className="divide-y divide-line">
      {bySeat.map((b) => (
        <li key={`b${b.id}`} className="flex items-center gap-3 px-4 py-3">
          <span className="grid h-9 w-12 shrink-0 place-items-center rounded-lg bg-accent/15 text-sm font-bold text-accent">
            {b.seat_code}
          </span>
          <Person name={b.name} phone={b.phone} />
          {b.checked_in_at ? (
            <span className="shrink-0 rounded-full bg-ok/15 px-2.5 py-1 text-xs font-semibold text-ok">
              Hadir {formatClock(b.checked_in_at)}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">Tidak hadir</span>
          )}
        </li>
      ))}
      {walkIns.map((w) => (
        <li key={`w${w.id}`} className="flex items-center gap-3 px-4 py-3">
          <span className="grid h-9 w-12 shrink-0 place-items-center rounded-lg bg-surface-2 text-[10px] font-bold text-muted uppercase">
            Walk-in
          </span>
          <Person name={w.name} phone={w.phone} />
          <span className="shrink-0 rounded-full bg-ok/15 px-2.5 py-1 text-xs font-semibold text-ok">
            Hadir {formatClock(w.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Person({ name, phone }: { name: string; phone: string | null }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold">{name}</p>
      {phone ? (
        <a
          href={waLink(phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ok underline-offset-2 hover:underline"
        >
          {formatPhone(phone)} ↗
        </a>
      ) : (
        <p className="text-sm text-muted">—</p>
      )}
    </div>
  );
}
