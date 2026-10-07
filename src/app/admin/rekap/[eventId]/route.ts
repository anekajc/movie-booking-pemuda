import writeXlsxFile, { type Row } from "write-excel-file/node";
import { isAdmin } from "@/lib/auth";
import { getBookings, getRecap, getWalkIns } from "@/lib/db";
import { getEvent, formatEventDate, formatEventTime, formatStamp, formatClock } from "@/lib/events";
import { formatPhone } from "@/lib/phone";
import { sortSeats } from "@/lib/seats";
import { shortCode } from "@/lib/ticket";

export const dynamic = "force-dynamic";

const bold = (value: string) => ({ value, fontWeight: "bold" as const });

// Attendance recap for one event as an Excel file: a summary sheet and a sheet with everyone.
export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const event = await getEvent(Number((await params).eventId));
  if (!event) return new Response("Acara tidak ditemukan", { status: 404 });

  const [bookings, walkIns, recap] = await Promise.all([
    getBookings(event.id),
    getWalkIns(event.id),
    getRecap(event.id),
  ]);

  const summary: Row[] = [
    [bold("Persekutuan"), event.fellowshipTitle],
    [bold("Film"), event.movieTitle],
    [bold("Tanggal"), formatEventDate(event.eventDate)],
    [bold("Jam"), formatEventTime(event.eventTime)],
    [bold("Tempat"), event.location],
    [],
    [bold("Terdaftar"), recap.registered],
    [bold("Hadir (terdaftar)"), recap.attended],
    [bold("Tidak hadir"), recap.registered - recap.attended],
    [bold("Walk-in"), recap.walkIns],
    [bold("Total hadir"), recap.attended + recap.walkIns],
  ];

  const header = ["No", "Nama", "No. WhatsApp", "Kursi", "Jenis", "Hadir", "Jam hadir", "Waktu daftar", "Kode tiket"];
  const people: Row[] = [header.map(bold)];
  const ordered = sortSeats(bookings.map((b) => b.seat_code)).map((s) => bookings.find((b) => b.seat_code === s)!);
  for (const b of ordered) {
    people.push([
      people.length,
      b.name,
      formatPhone(b.phone),
      b.seat_code,
      "Terdaftar",
      b.checked_in_at ? "Ya" : "Tidak",
      b.checked_in_at ? formatClock(b.checked_in_at) : "",
      formatStamp(b.created_at),
      shortCode(b.group_id),
    ]);
  }
  for (const w of [...walkIns].reverse()) {
    people.push([
      people.length,
      w.name,
      w.phone ? formatPhone(w.phone) : "",
      "",
      "Walk-in",
      "Ya",
      formatClock(w.created_at),
      "",
      "",
    ]);
  }

  const buffer = await writeXlsxFile([
    { data: summary, sheet: "Ringkasan", columns: [{ width: 22 }, { width: 40 }] },
    {
      data: people,
      sheet: "Daftar Hadir",
      columns: [{ width: 5 }, { width: 30 }, { width: 18 }, { width: 8 }, { width: 11 }, { width: 7 }, { width: 10 }, { width: 16 }, { width: 12 }],
    },
  ]).toBuffer();

  const slug = `${event.movieTitle}-${event.eventDate}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rekap-${slug}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
