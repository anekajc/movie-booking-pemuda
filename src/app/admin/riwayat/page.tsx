import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { getActiveEvent, getArchivedEvents, formatEventDate } from "@/lib/events";
import { LoginForm } from "../LoginForm";
import { AdminHeader } from "../AdminHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Riwayat · Admin", robots: { index: false } };

export default async function HistoryPage() {
  if (!(await isAdmin())) return <LoginForm next="/admin/riwayat" />;

  const [event, past] = await Promise.all([getActiveEvent(), getArchivedEvents()]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <AdminHeader event={event} active="/admin/riwayat" />

      <section className="rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-semibold">Acara Sebelumnya</h2>
        </div>
        {past.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Belum ada. Acara masuk ke sini setelah diarsipkan lewat tombol &ldquo;Arsipkan &amp; mulai acara baru&rdquo;.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {past.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/riwayat/${e.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-surface-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.movieTitle}</p>
                    <p className="truncate text-sm text-muted">
                      {formatEventDate(e.eventDate)} · {e.fellowshipTitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold text-accent tabular-nums">{e.attended + e.walkIns}</p>
                    <p className="text-xs text-muted">hadir</p>
                  </div>
                  <span className="text-muted">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
