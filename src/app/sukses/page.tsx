import Link from "next/link";
import { event } from "@/config/event";
import { EventInfo } from "@/components/EventInfo";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ seat?: string; name?: string }>;
}) {
  const { seat = "", name = "" } = await searchParams;

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-ok/15 text-2xl text-ok">✓</div>
        <h1 className="mt-4 text-2xl font-extrabold">Terima kasih{name ? `, ${name}` : ""}!</h1>
        <p className="mt-1 text-muted">Kursimu sudah tercatat.</p>
      </div>

      {/* Ticket */}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-2xl shadow-black/40">
        <div className="border-b border-line/60 px-6 pt-6 pb-5">
          <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">{event.title}</p>
          <p className="mt-1 text-xl font-bold">{event.movie}</p>
        </div>
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs tracking-wider text-muted uppercase">Atas nama</p>
            <p className="mt-0.5 text-lg font-semibold">{name || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-wider text-muted uppercase">Kursi</p>
            <p className="text-4xl font-extrabold text-accent">{seat || "—"}</p>
          </div>
        </div>
        <div className="perforation" />
        <div className="px-6 pt-4 pb-6">
          <EventInfo />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm leading-relaxed">
        <p className="font-semibold text-accent">Jangan lupa datang ya! 🎬</p>
        <p className="mt-1 text-text/90">{event.note}</p>
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
