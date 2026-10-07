import "server-only";
import { headers } from "next/headers";
import { ticketPath } from "./ticket";

// Public base URL of the site. Uses APP_URL when set, otherwise the request's
// host as forwarded by the reverse proxy (Coolify sets X-Forwarded-Proto/Host).
export async function getOrigin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function ticketUrl(groupId: string) {
  return `${await getOrigin()}${ticketPath(groupId)}`;
}
