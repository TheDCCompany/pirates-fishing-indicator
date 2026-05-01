"use client";

const CAM_URL = "https://www.galvestonfishingpier.com/";

export default function LiveCamCard() {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
        <p className="text-xs uppercase tracking-widest text-slate-400">📷 Live Cam — Galveston Fishing Pier</p>
        <a
          href={CAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Open ↗
        </a>
      </div>

      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={CAM_URL}
          className="absolute inset-0 w-full h-full border-0"
          title="Galveston Fishing Pier Live Cam"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
