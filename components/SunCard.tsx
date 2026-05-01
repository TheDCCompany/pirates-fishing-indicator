"use client";

import { FishingConditions } from "@/types/fishing";

type Props = { sun: FishingConditions["sun"] };

function formatTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// SVG day arc: semicircle from sunrise to sunset, sun dot shows current position
function DayArc({ sunrise, sunset }: { sunrise: string; sunset: string }) {
  const W = 180, H = 70;
  const cx = W / 2, cy = H + 10;
  const r = H + 5;

  const now = new Date();
  const sr = new Date(sunrise);
  const ss = new Date(sunset);

  const totalMs = ss.getTime() - sr.getTime();
  const elapsedMs = now.getTime() - sr.getTime();
  const pct = Math.max(0, Math.min(1, elapsedMs / totalMs));

  // Arc goes from 180° (left) to 0° (right) over the top
  const angleFromLeft = Math.PI - pct * Math.PI; // left=π, right=0, top=π/2
  const sunX = cx + r * Math.cos(angleFromLeft);
  const sunY = cy - r * Math.sin(angleFromLeft); // note: subtract because SVG y is inverted

  const isDay = pct >= 0 && pct <= 1 && now >= sr && now <= ss;

  return (
    <svg width={W} height={H + 12} viewBox={`0 0 ${W} ${H + 12}`} className="w-full">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      {/* Track arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round"
      />
      {/* Progress arc */}
      {isDay && (
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${sunX} ${sunY}`}
          fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"
          strokeOpacity="0.6"
        />
      )}
      {/* Horizon line */}
      <line x1={cx - r - 6} y1={cy} x2={cx + r + 6} y2={cy} stroke="#334155" strokeWidth="1" />
      {/* Sun dot */}
      {isDay && (
        <circle cx={sunX} cy={sunY} r="6" fill="#fde68a"
          style={{ filter: "drop-shadow(0 0 6px #fde68a)" }}
        />
      )}
      {/* Sunrise marker */}
      <circle cx={cx - r} cy={cy} r="3" fill="#fb923c" />
      {/* Sunset marker */}
      <circle cx={cx + r} cy={cy} r="3" fill="#a855f7" />
    </svg>
  );
}

export default function SunCard({ sun }: Props) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 flex flex-col items-center gap-2 col-span-2">
      <p className="text-xs uppercase tracking-widest text-slate-400 self-start">Sun</p>

      <DayArc sunrise={sun.sunrise} sunset={sun.sunset} />

      <div className="flex justify-between w-full px-1">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg">🌅</span>
          <span className="text-sm font-semibold text-amber-300">{formatTime(sun.sunrise)}</span>
          <span className="text-xs text-slate-500">Sunrise</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg">🌇</span>
          <span className="text-sm font-semibold text-purple-300">{formatTime(sun.sunset)}</span>
          <span className="text-xs text-slate-500">Sunset</span>
        </div>
      </div>
    </div>
  );
}
