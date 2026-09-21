"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

// -----------------------------------------------------------------------
// WHY THIS EXISTS
//
// wa.me / t.me links work great on a phone, where the OS hands them
// straight to the WhatsApp / Telegram app. On a desktop browser with no
// matching app installed, clicking one of these instead dumps the user onto
// web.whatsapp.com asking them to scan a QR code to LOG IN — which has
// nothing to do with our bot number and just confuses people who registered
// from a PC.
//
// A QR code of the ACTUAL wa.me link sidesteps this entirely: the user
// scans it with their phone's camera (or WhatsApp's own in-app scanner),
// which opens the real chat with our bot, pre-filled message and all —
// exactly as if they'd tapped the link on their phone directly.
// -----------------------------------------------------------------------

export default function ConnectQrCode({
  url,
  size = 176,
  label = "Or scan with your phone's camera",
}: {
  url: string;
  size?: number;
  label?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setFailed(false);

    if (!url) return;

    QRCode.toDataURL(url, {
      width: size * 2, // render at 2x for crisp display on retina screens
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((generated) => {
        if (!cancelled) setDataUrl(generated);
      })
      .catch((err) => {
        console.error("QR generation failed:", err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url, size]);

  // Fails silently into nothing rather than a broken image — the primary
  // "Open WhatsApp/Telegram" button right above this is always still there,
  // so a QR generation hiccup never blocks the user from connecting.
  if (failed || !url) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-2xl bg-white p-3 shadow-inner"
        style={{ width: size + 24, height: size + 24 }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt="Scan to connect on WhatsApp"
            width={size}
            height={size}
            className="w-full h-full"
          />
        ) : (
          <div
            className="w-full h-full animate-pulse bg-slate-200 rounded-xl"
            style={{ width: size, height: size }}
          />
        )}
      </div>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
