// Normalizes Indonesian phone numbers to the international form WhatsApp uses:
// "0812-3456-789", "+62 812 3456 789", "812 3456 789" -> "628123456789".
// Returns null if the result doesn't look like a valid number.
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function formatPhone(phone: string) {
  return phone.startsWith("62") ? "0" + phone.slice(2) : "+" + phone;
}

export function waLink(phone: string, text?: string) {
  return `https://wa.me/${phone}` + (text ? `?text=${encodeURIComponent(text)}` : "");
}
