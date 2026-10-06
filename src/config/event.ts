// Edit this file to change the event details and the seat layout.

export const event = {
  title: "Test Fellowship",
  movie: "Judul Film",
  date: "Sabtu, 55 Oktober 2026",
  time: "18.30 WIB",
  location: "GSG Lt. 2",
  note: "Datang 15 menit lebih awal ya, supaya bisa duduk dengan tenang sebelum film dimulai.",
};

export const seating = {
  // Row labels, front (closest to the screen) to back.
  rows: ["A", "B", "C", "D", "E", "F"],
  seatsPerRow: 10,
  // An aisle gap is drawn after these seat numbers.
  aisleAfter: [5],
  // Seats that cannot be booked (e.g. reserved, broken). Example: ["A1", "A10"]
  blocked: [] as string[],
};

// Pre-filled text when the admin taps a phone number to chat on WhatsApp.
export function whatsappReminder(name: string, seat: string) {
  return `Shalom ${name}! Mengingatkan acara ${event.title} (${event.movie}) pada ${event.date} pukul ${event.time} di ${event.location}. Kursi kamu: ${seat}. Sampai jumpa! 🙏`;
}
