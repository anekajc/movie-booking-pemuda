import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { findGroupByCode, getGroup, getRecap, getWalkIns, type Booking } from "@/lib/db";
import { getActiveEvent, getEvent, formatClock, formatEventDate, type EventSettings } from "@/lib/events";
import { formatPhone } from "@/lib/phone";
import { sortSeats } from "@/lib/seats";
import { shortCode, UUID_RE } from "@/lib/ticket";
import { LoginForm } from "../LoginForm";
import { AdminHeader } from "../AdminHeader";
import { ConfirmButton } from "../ConfirmButton";
import { DownloadRecap, RecapStats } from "../Recap";
import { deleteWalkIn, setAttendance } from "../actions";
import { Scanner } from "./Scanner";
import { WalkInForm } from "./WalkInForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kehadiran · Admin", robots: { index: false } };

const bySeat = (group: Booking[]) =>
  sortSeats(group.map((b) => b.seat_code)).map((s) => group.find((b) => b.seat_code === s)!);

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string; kode?: string; ok?: string }>;
}) {
  if (!(await isAdmin())) return <LoginForm next="/admin/kehadiran" />;

  const event = await getActiveEvent();
  const { g, kode, ok } = await searchParams;

  // Which ticket to check in: scanned (?g=<uuid>) or typed (?kode=3F2A9C1B).
  let groupId = g && UUID_RE.test(g) ? g.toLowerCase() : null;
  let lookupError = "";
  if (!groupId && kode?.trim()) {
    groupId = await findGroupByCode(event.id, kode.trim());
    if (!groupId) lookupError = `Kode tiket "${kode.trim().toUpperCase()}" tidak ditemukan untuk acara ini.`;
  }

  const [recap, walkIns, group, saved] = await Promise.all([
    getRecap(event.id),
    getWalkIns(event.id),
    groupId ? getGroup(groupId) : Promise.resolve([]),
    ok && UUID_RE.test(ok) ? getGroup(ok) : Promise.resolve([]),
  ]);
  if (groupId && group.length === 0) lookupError = "Tiket tidak ditemukan. Mungkin pesanannya sudah dihapus.";
  const otherEvent = group.length && group[0].event_id !== event.id ? await getEvent(group[0].event_id) : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <AdminHeader event={event} active="/admin/kehadiran" />

      <RecapStats recap={recap} live />
      <div className="mt-3 flex justify-end">
        <DownloadRecap eventId={event.id} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          {group.length > 0 && !otherEvent ? (
            <CheckInCard group={bySeat(group)} />
          ) : (
            <>
              <h2 className="mb-3 font-semibold">Scan Tiket</h2>
              {saved.length > 0 && <SavedNotice group={bySeat(saved)} />}
              {otherEvent && <OtherEventNotice event={otherEvent} />}
              {lookupError && (
                <p role="alert" className="mb-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {lookupError}
                </p>
              )}
              <Scanner />
              <form action="/admin/kehadiran" className="mt-4 flex gap-2">
                <input
                  name="kode"
                  required
                  maxLength={8}
                  autoComplete="off"
                  placeholder="Kode tiket, mis. 3F2A9C1B"
                  aria-label="Kode tiket"
                  className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-4 py-2.5 font-mono uppercase outline-none placeholder:font-sans placeholder:normal-case placeholder:text-muted/60 focus:border-accent"
                />
                <button className="shrink-0 rounded-xl border border-line px-4 font-semibold hover:border-accent hover:text-accent">
                  Cari
                </button>
              </form>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <h2 className="font-semibold">Tambah Walk-in</h2>
            <p className="mt-1 mb-4 text-xs text-muted">Untuk yang datang tanpa mendaftar. Langsung tercatat hadir.</p>
            <WalkInForm />
          </section>

          <section className="rounded-2xl border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold">Walk-in</h2>
              <span className="text-xs text-muted">{walkIns.length} orang</span>
            </div>
            {walkIns.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">Belum ada.</p>
            ) : (
              <ul className="divide-y divide-line">
                {walkIns.map((w) => (
                  <li key={w.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{w.name}</p>
                      <p className="text-xs text-muted">
                        {w.phone ? formatPhone(w.phone) : "—"} · {formatClock(w.created_at)}
                      </p>
                    </div>
                    <form action={deleteWalkIn}>
                      <input type="hidden" name="id" value={w.id} />
                      <ConfirmButton
                        message={`Hapus walk-in ${w.name}?`}
                        className="rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger/10"
                      >
                        Hapus
                      </ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

function CheckInCard({ group }: { group: Booking[] }) {
  // First check-in: everyone ticked; afterwards show what was saved so a latecomer can be added.
  const firstTime = group.every((b) => !b.checked_in_at);

  return (
    <form action={setAttendance}>
      <input type="hidden" name="groupId" value={group[0].group_id} />
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">Siapa yang hadir?</h2>
        <span className="font-mono text-xs text-muted">Tiket {shortCode(group[0].group_id)}</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {group.length > 1
          ? `Pesanan ${group.length} kursi. Hilangkan centang untuk yang tidak datang.`
          : "Pastikan nama sesuai, lalu simpan."}
      </p>

      <ul className="mt-4 space-y-2">
        {group.map((b) => (
          <li key={b.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3 transition has-checked:border-ok/60 has-checked:bg-ok/10">
              <input
                type="checkbox"
                name="present"
                value={b.id}
                defaultChecked={firstTime || !!b.checked_in_at}
                className="size-5 shrink-0 accent-[#4cc38a]"
              />
              <span className="grid h-9 w-12 shrink-0 place-items-center rounded-lg bg-accent/15 text-sm font-bold text-accent">
                {b.seat_code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{b.name}</span>
                {b.checked_in_at && (
                  <span className="block text-xs text-ok">Sudah hadir {formatClock(b.checked_in_at)}</span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex gap-2">
        <Link
          href="/admin/kehadiran"
          className="rounded-xl border border-line px-5 py-3 font-semibold text-muted hover:text-text"
        >
          Batal
        </Link>
        <button className="flex-1 rounded-xl bg-ok py-3 font-bold text-[#062113] transition active:scale-[0.98]">
          Simpan kehadiran
        </button>
      </div>
    </form>
  );
}

function SavedNotice({ group }: { group: Booking[] }) {
  const present = group.filter((b) => b.checked_in_at);
  return (
    <div role="status" className="mb-4 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm">
      <p className="font-semibold text-ok">
        ✓ Tersimpan: {present.length} dari {group.length} hadir
      </p>
      {present.length > 0 && (
        <p className="mt-0.5 text-text/90">{present.map((b) => `${b.name} (${b.seat_code})`).join(", ")}</p>
      )}
    </div>
  );
}

function OtherEventNotice({ event }: { event: EventSettings }) {
  return (
    <p role="alert" className="mb-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      Tiket ini untuk acara lain: {event.movieTitle} ({formatEventDate(event.eventDate)}).
    </p>
  );
}
