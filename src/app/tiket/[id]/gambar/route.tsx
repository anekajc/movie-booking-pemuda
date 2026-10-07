import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getGroup } from "@/lib/db";
import { getEvent, formatEventDate, formatEventTime } from "@/lib/events";
import { sortSeats } from "@/lib/seats";
import { shortCode, UUID_RE } from "@/lib/ticket";
import { ticketUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

const C = {
  bg: "#0d0f17",
  surface: "#161926",
  line: "#2c3146",
  text: "#eef0f6",
  muted: "#9097ad",
  accent: "#f5b83d",
};

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 600 | 800 }[]> | undefined;
function loadFonts() {
  // Fonts are copied into the image (see Dockerfile); cwd is the app root in dev and in the container.
  fonts ??= Promise.all(
    ([400, 600, 800] as const).map(async (weight) => ({
      name: "Jakarta",
      weight,
      data: await readFile(join(process.cwd(), "assets", "fonts", `jakarta-${weight}.woff`)),
    })),
  );
  return fonts;
}

// The whole ticket as a PNG, so guests can save it to their gallery.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = UUID_RE.test(id) ? await getGroup(id) : [];
  const event = group.length ? await getEvent(group[0].event_id) : null;
  if (!event) return new Response("Tiket tidak ditemukan", { status: 404 });

  const people = sortSeats(group.map((b) => b.seat_code)).map((seat) => group.find((b) => b.seat_code === seat)!);
  const multi = people.length > 1;
  const qr = await QRCode.toDataURL(await ticketUrl(id), {
    margin: 0,
    width: 440,
    errorCorrectionLevel: "M",
    color: { dark: C.bg, light: "#ffffff" },
  });

  const W = 1080;
  const H = 1580 + (multi ? people.length * 88 - 150 : 0);
  const info = [
    ["Tanggal", formatEventDate(event.eventDate)],
    ["Jam", formatEventTime(event.eventTime)],
    ["Tempat", event.location],
  ];
  const label = { fontSize: 24, color: C.muted, letterSpacing: 3, textTransform: "uppercase" as const };

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: W, height: H, background: C.bg, padding: 56, fontFamily: "Jakarta" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            background: C.surface,
            borderRadius: 40,
            overflow: "hidden",
            color: C.text,
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "56px 64px 44px",
              borderBottom: `2px solid ${C.line}`,
            }}
          >
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: C.accent, letterSpacing: 7 }}>
              {event.fellowshipTitle.toUpperCase()}
            </div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, marginTop: 10, lineHeight: 1.1 }}>
              {event.movieTitle}
            </div>
          </div>

          {/* People */}
          <div style={{ display: "flex", flexDirection: "column", padding: "36px 64px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", ...label }}>
              <span>Atas nama</span>
              <span>Kursi</span>
            </div>
            {people.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: multi ? 14 : 8,
                }}
              >
                <span style={{ fontSize: multi ? 40 : 46, fontWeight: 600, maxWidth: 640 }}>{p.name}</span>
                <span style={{ fontSize: multi ? 60 : 120, fontWeight: 800, color: C.accent, lineHeight: 1 }}>
                  {p.seat_code}
                </span>
              </div>
            ))}
          </div>

          {/* Perforation */}
          <div style={{ display: "flex", justifyContent: "space-between", margin: "0 -14px" }}>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} style={{ width: 26, height: 26, borderRadius: 13, background: C.bg }} />
            ))}
          </div>

          {/* Event info */}
          <div style={{ display: "flex", flexDirection: "column", padding: "32px 64px 36px" }}>
            {info.map(([k, v]) => (
              <div
                key={k}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}
              >
                <span style={label}>{k}</span>
                <span style={{ fontSize: 36, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* QR */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderTop: `2px solid ${C.line}`,
              padding: "48px 64px 0",
            }}
          >
            <div style={{ display: "flex", background: "#ffffff", padding: 28, borderRadius: 32 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} width={440} height={440} alt="" />
            </div>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 600, marginTop: 30 }}>
              Tunjukkan QR ini saat datang
            </div>
            <div style={{ display: "flex", fontSize: 26, color: C.muted, marginTop: 10 }}>
              {`Kode tiket: ${shortCode(id)}`}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: await loadFonts(),
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
