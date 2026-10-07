import Link from "next/link";
import { formatEventDate, formatEventTime, type EventSettings } from "@/lib/events";
import { logout } from "./actions";

const tabs = [
  { href: "/admin", label: "Pendaftar" },
  { href: "/admin/kehadiran", label: "Kehadiran" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
  { href: "/admin/riwayat", label: "Riwayat" },
];

export function AdminHeader({ event, active }: { event: EventSettings; active: string }) {
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">Admin</p>
          <h1 className="mt-1 text-2xl font-extrabold">{event.movieTitle}</h1>
          <p className="text-sm text-muted">
            {formatEventDate(event.eventDate)} · {formatEventTime(event.eventTime)} · {event.location}
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-text">Keluar</button>
        </form>
      </div>
      <nav className="mt-5 flex gap-1 rounded-xl border border-line bg-surface p-1 text-sm font-semibold sm:inline-flex">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active === t.href ? "page" : undefined}
            className={`flex-1 rounded-lg px-2 py-2 text-center transition sm:px-4 ${
              active === t.href ? "bg-accent text-accent-ink" : "text-muted hover:text-text"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
