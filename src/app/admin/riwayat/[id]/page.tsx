import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getBookings, getRecap, getWalkIns } from "@/lib/db";
import { getActiveEvent, getEvent, formatEventDate, formatEventTime } from "@/lib/events";
import { LoginForm } from "../../LoginForm";
import { AdminHeader } from "../../AdminHeader";
import { AttendeeList, DownloadRecap, RecapStats } from "../../Recap";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Riwayat · Admin", robots: { index: false } };

export default async function PastEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdmin())) return <LoginForm next={`/admin/riwayat/${id}`} />;

  const [active, past] = await Promise.all([getActiveEvent(), getEvent(Number(id))]);
  if (!past || !past.archivedAt) notFound();

  const [recap, bookings, walkIns] = await Promise.all([getRecap(past.id), getBookings(past.id), getWalkIns(past.id)]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <AdminHeader event={active} active="/admin/riwayat" />

      <Link href="/admin/riwayat" className="text-sm text-muted hover:text-text">
        ← Semua riwayat
      </Link>
      <div className="mt-3 mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">{past.fellowshipTitle}</p>
          <h2 className="mt-1 text-xl font-extrabold">{past.movieTitle}</h2>
          <p className="text-sm text-muted">
            {formatEventDate(past.eventDate)} · {formatEventTime(past.eventTime)} · {past.location}
          </p>
        </div>
        <DownloadRecap eventId={past.id} />
      </div>

      <RecapStats recap={recap} />

      <section className="mt-6 rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-semibold">Daftar Hadir</h3>
          <span className="text-xs text-muted">{bookings.length + walkIns.length} orang</span>
        </div>
        <AttendeeList bookings={bookings} walkIns={walkIns} />
      </section>
    </main>
  );
}
