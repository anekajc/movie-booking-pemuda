import Link from "next/link";
import { arrivalNote } from "@/config/event";
import { getGroup } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { sortSeats } from "@/lib/seats";
import { EventInfo } from "@/components/EventInfo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pemesanan Berhasil" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g = "" } = await searchParams;
  const [settings, group] = await Promise.all([getSettings(), UUID_RE.test(g) ? getGroup(g) : []]);

  if (group.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold">Pesanan tidak ditemukan.</p>
        <p className="mt-2 text-sm text-muted">Mungkin sudah dibatalkan. Silakan hubungi panitia bila ada pertanyaan.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-accent-ink">
          Lihat denah kursi
        </Link>
      </main>
    );
  }

  const order = sortSeats(group.map((b) => b.seat_code));
  const people = order.map((seat) => group.find((b) => b.seat_code === seat)!);

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-ok/15 text-2xl text-ok">✓</div>
        <h1 className="mt-4 text-2xl font-extrabold">Terima kasih, {group[0].name}!</h1>
        <p className="mt-1 text-muted">
          {people.length > 1 ? `${people.length} kursi sudah tercatat.` : "Kursimu sudah tercatat."}
        </p>
      </div>

      {/* Ticket */}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-2xl shadow-black/40">
        <div className="border-b border-line/60 px-6 pt-6 pb-5">
          <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">{settings.fellowshipTitle}</p>
          <p className="mt-1 text-xl font-bold">{settings.movieTitle}</p>
        </div>
        <div className="px-6 py-4">
          <div className="flex justify-between text-xs tracking-wider text-muted uppercase">
            <span>Atas nama</span>
            <span>Kursi</span>
          </div>
          <ul className="mt-1 divide-y divide-line/60">
            {people.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-2.5">
                <span className="min-w-0 truncate text-lg font-semibold">{p.name}</span>
                <span className={`font-extrabold text-accent ${people.length > 1 ? "text-2xl" : "text-4xl"}`}>
                  {p.seat_code}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="perforation" />
        <div className="px-6 pt-4 pb-6">
          <EventInfo settings={settings} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm leading-relaxed">
        <p className="font-semibold text-accent">Jangan lupa datang ya! 🎬</p>
        <p className="mt-1 text-text/90">{arrivalNote}</p>
      </div>

      <p className="mt-6 text-center text-xs text-muted">Simpan / screenshot halaman ini sebagai pengingat.</p>
      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-muted underline underline-offset-2 hover:text-text">
          Kembali ke denah kursi
        </Link>
      </div>
    </main>
  );
}
