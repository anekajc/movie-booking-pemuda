import { redirect } from "next/navigation";
import { ticketPath, UUID_RE } from "@/lib/ticket";

// Old confirmation URL (/sukses?g=<id>); tickets now live at /tiket/<id>.
export default async function SuccessRedirect({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g = "" } = await searchParams;
  redirect(UUID_RE.test(g) ? ticketPath(g) : "/");
}
