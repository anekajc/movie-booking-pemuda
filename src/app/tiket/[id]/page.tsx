import Link from "next/link";
import QRCode from "qrcode";
import { arrivalNote } from "@/config/event";
import { getGroup } from "@/lib/db";
import { getEvent } from "@/lib/events";
import { sortSeats } from "@/lib/seats";
import { shortCode, UUID_RE } from "@/lib/ticket";
import { ticketUrl } from "@/lib/url";
import { EventInfo } from "@/components/EventInfo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tiket", robots: { index: false } };

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  const { id } = await params;
  const { baru } = await searchParams;
  const group = UUID_RE.test(id) ? await getGroup(id) : [];
  const event = group.length ? await getEvent(group[0].event_id) : null;

  if (!event) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold">Tiket tidak ditemukan.</p>
        <p className="mt-2 text-sm text-muted">Mungkin sudah dibatalkan. Silakan hubungi panitia bila ada pertanyaan.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-accent-ink">
          Lihat denah kursi
        </Link>
      </main>
    );
  }

  const people = sortSeats(group.map((b) => b.seat_code)).map((seat) => group.find((b) => b.seat_code === seat)!);
  const qrSvg = await QRCode.toString(await ticketUrl(id), {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0d0f17", light: "#ffffff" },
  });
  const fileName = `tiket-${people.map((p) => p.seat_code).join("-")}.png`;

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6 text-center">
        {baru ? (
          <>
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-ok/15 text-2xl text-ok">✓</div>
            <h1 className="mt-4 text-2xl font-extrabold">Terima kasih, {group[0].name}!</h1>
            <p className="mt-1 text-muted">
              {people.length > 1 ? `${people.length} kursi sudah tercatat.` : "Kursimu sudah tercatat."}
            </p>
          </>
        ) : (
          <h1 className="text-2xl font-extrabold">Tiket Kamu</h1>
        )}
      </div>

      {event.archivedAt && (
        <p className="mb-4 rounded-xl border border-line bg-surface px-4 py-3 text-center text-sm text-muted">
          Acara ini sudah selesai.
        </p>
      )}

      {/* Ticket */}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-2xl shadow-black/40">
        <div className="border-b border-line/60 px-6 pt-6 pb-5">
          <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">{event.fellowshipTitle}</p>
          <p className="mt-1 text-xl font-bold">{event.movieTitle}</p>
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
        <div className="px-6 pt-4 pb-5">
          <EventInfo settings={event} />
        </div>
        <div className="flex flex-col items-center border-t border-line/60 px-6 pt-6 pb-6">
          <div
            className="size-48 rounded-2xl bg-white p-3 [&>svg]:size-full"
            role="img"
            aria-label="QR code tiket"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="mt-3 text-sm font-semibold">Tunjukkan QR ini saat datang</p>
          <p className="mt-1 text-xs text-muted">
            Kode tiket: <span className="font-mono font-semibold tracking-wider text-text">{shortCode(id)}</span>
          </p>
        </div>
      </div>

      <a
        href={`/tiket/${id}/gambar`}
        download={fileName}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-bold text-accent-ink transition active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M12 3v12m0 0-5-5m5 5 5-5M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Simpan Tiket (Gambar)
      </a>
      <p className="mt-2 text-center text-xs text-muted">
        Halaman ini juga bisa dibuka lagi kapan saja lewat link yang sama.
      </p>

      {!event.archivedAt && (
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm leading-relaxed">
          <p className="font-semibold text-accent">Jangan lupa datang ya! 🎬</p>
          <p className="mt-1 text-text/90">{arrivalNote}</p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-muted underline underline-offset-2 hover:text-text">
          Kembali ke denah kursi
        </Link>
      </div>
    </main>
  );
}
