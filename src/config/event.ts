// Static settings. Event details and the seat grid size are edited in /admin/pengaturan;
// the values here are only used until the admin saves them for the first time.

export const defaultSettings = {
  fellowshipTitle: "Test Fellowship",
  movieTitle: "Judul Film",
  location: "GSG Lt. 2",
  eventDate: "2026-10-17", // YYYY-MM-DD
  eventTime: "18:30", // HH:MM
  rows: 6,
  seatsPerRow: 10,
};

// Shown on the confirmation page.
export const arrivalNote = "Datang 15 menit lebih awal ya, supaya bisa duduk dengan tenang sebelum film dimulai.";

// Time zone label shown after the event time.
export const timeZoneLabel = "WIB";

// Maximum seats one person can book in a single order.
export const maxSeatsPerBooking = 6;

// Limits for the seat grid in the admin settings (rows are labeled A–Z).
export const gridLimits = { maxRows: 26, maxSeatsPerRow: 30 };

// Seats that cannot be booked (e.g. reserved, broken). Example: ["A1", "A10"]
export const blockedSeats: string[] = [];

// Pre-filled text when the admin taps a phone number to chat on WhatsApp.
export function whatsappReminder(e: {
  name: string;
  seat: string;
  fellowship: string;
  movie: string;
  date: string;
  time: string;
  location: string;
}) {
  return `Shalom ${e.name}! Mengingatkan acara ${e.fellowship} (${e.movie}) pada ${e.date} pukul ${e.time} di ${e.location}. Kursi kamu: ${e.seat}. Sampai jumpa! 🙏`;
}
