import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { getTakenSeats } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "../LoginForm";
import { AdminHeader } from "../AdminHeader";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengaturan · Admin", robots: { index: false } };

export default async function SettingsPage() {
  if (!(await isAdmin())) return <LoginForm next="/admin/pengaturan" />;

  const [settings, bookedSeats] = await Promise.all([getSettings(), getTakenSeats()]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <AdminHeader settings={settings} active="/admin/pengaturan" />
      <SettingsForm settings={settings} bookedSeats={bookedSeats} />
    </main>
  );
}
