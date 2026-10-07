"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractTicketId } from "@/lib/ticket";

type Status = "starting" | "scanning" | "error";

// Camera QR scanner. On a valid ticket QR it opens the check-in card for that booking.
export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<Status>("starting");
  const [hint, setHint] = useState("");

  useEffect(() => {
    let scanner: import("qr-scanner").default | undefined;
    let cancelled = false;
    let handled = false;

    (async () => {
      // Loaded on demand: the library touches browser-only APIs.
      const { default: QrScanner } = await import("qr-scanner");
      if (cancelled || !videoRef.current) return;
      scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (handled) return;
          const id = extractTicketId(result.data);
          if (!id) {
            setHint("QR tidak dikenali. Pastikan ini QR dari tiket acara.");
            return;
          }
          handled = true;
          navigator.vibrate?.(80);
          scanner?.stop();
          router.push(`/admin/kehadiran?g=${id}`);
        },
        { preferredCamera: "environment", highlightScanRegion: true, highlightCodeOutline: true, maxScansPerSecond: 8 },
      );
      try {
        await scanner.start();
        if (!cancelled) setStatus("scanning");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [router]);

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} className="size-full object-cover" muted playsInline />
        {status !== "scanning" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted">
            {status === "starting" ? (
              "Membuka kamera…"
            ) : (
              <div>
                <p className="font-semibold text-text">Kamera tidak bisa dibuka.</p>
                <p className="mt-1">
                  Izinkan akses kamera di browser, lalu muat ulang halaman. Atau ketik kode tiket di bawah.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <p className={`mt-2 text-center text-xs ${hint ? "text-danger" : "text-muted"}`} aria-live="polite">
        {hint || "Arahkan kamera ke QR pada tiket."}
      </p>
    </div>
  );
}
