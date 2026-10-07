// Ticket identifiers. A ticket is one booking group; its QR encodes the ticket URL
// (/tiket/<group uuid>), so the admin scanner and any phone camera both understand it.

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// Accepts a scanned ticket URL or a bare UUID; returns the group id or null.
export function extractTicketId(text: string): string | null {
  return UUID_IN_TEXT.exec(text)?.[0].toLowerCase() ?? null;
}

// Short code printed on the ticket for typing in by hand: "3F2A9C1B".
export function shortCode(groupId: string) {
  return groupId.slice(0, 8).toUpperCase();
}

export function ticketPath(groupId: string) {
  return `/tiket/${groupId}`;
}
