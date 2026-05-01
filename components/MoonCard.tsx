"use client";

import { FishingConditions } from "@/types/fishing";

type Props = { moon: FishingConditions["moon"] };

// SVG arc for illumination
function IlluminationArc({ pct }: { pct: number }) {
  const r = 22, cx = 28, cy = 28;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;

  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#fde68a"
        strokeWidth="5"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: "drop-shadow(0 0 4px #fde68a88)" }}
      />
    </svg>
  );
}

export default function MoonCard({ moon }: Props) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 flex flex-col items-center gap-3">
      <p className="text-xs uppercase tracking-widest text-slate-400 self-start">Moon</p>

      <span className="text-5xl select-none leading-none">{moon.emoji}</span>

      <div className="text-center">
        <div className="text-sm font-semibold text-slate-200">{moon.phase}</div>
        <div className="text-xs text-slate-400 mt-0.5">{moon.illumination}% lit</div>
      </div>

      <IlluminationArc pct={moon.illumination} />
    </div>
  );
}
