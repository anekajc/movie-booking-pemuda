import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { getTakenSeats } from "@/lib/db";
import { getActiveEvent } from "@/lib/events";
import { LoginForm } from "../LoginForm";
import { AdminHeader } from "../AdminHeader";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengaturan · Admin", robots: { index: false } };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ baru?: string }> }) {
  if (!(await isAdmin())) return <LoginForm next="/admin/pengaturan" />;

  const event = await getActiveEvent();
  const [bookedSeats, { baru }] = await Promise.all([getTakenSeats(event.id), searchParams]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <AdminHeader event={event} active="/admin/pengaturan" />
      {baru && (
        <p role="status" className="mb-5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          <span className="font-semibold text-accent">Acara baru dibuat.</span> Acara sebelumnya tersimpan di Riwayat.
          Perbarui detail acara di bawah lalu simpan.
        </p>
      )}
      <SettingsForm key={event.id} settings={event} bookedSeats={bookedSeats} />
    </main>
  );
}
