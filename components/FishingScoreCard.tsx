"use client";

import { FishingConditions } from "@/types/fishing";

type Props = { score: FishingConditions["score"] };

const THEME = {
  Good:  { stroke: "#34d399", text: "text-emerald-400", badge: "bg-emerald-500", bar: "bg-emerald-400", glow: "shadow-emerald-500/20" },
  Fair:  { stroke: "#fbbf24", text: "text-amber-400",   badge: "bg-amber-500",   bar: "bg-amber-400",   glow: "shadow-amber-500/20"  },
  Poor:  { stroke: "#f87171", text: "text-red-400",     badge: "bg-red-600",     bar: "bg-red-500",     glow: "shadow-red-500/20"    },
} as const;

const SUB: { key: keyof typeof subs; label: string; max: number }[] = [
  { key: "wind",    label: "Wind",    max: 30 },
  { key: "tide",    label: "Tide",    max: 25 },
  { key: "weather", label: "Weather", max: 15 },
  { key: "sunMoon", label: "Sun/Moon",max: 15 },
  { key: "surf",    label: "Surf",    max: 15 },
];

// fake declaration to satisfy TS in the array literal above
const subs = { wind: 0, tide: 0, weather: 0, sunMoon: 0, surf: 0 };
void subs;

// SVG arc gauge
function ScoreGauge({ score, label }: { score: number; label: keyof typeof THEME }) {
  const t = THEME[label];
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;
  // Use 75% of the circle (from 135° to 405°, i.e. 270° sweep)
  const sweep = 0.75;
  const dashTotal = circumference * sweep;
  const dashFill  = (score / 100) * dashTotal;

  // Arc starts at bottom-left (135°) and goes clockwise to bottom-right (45°)
  const startAngle = 135 * (Math.PI / 180);
  const endAngle   = (135 + 270) * (Math.PI / 180);

  function arcPoint(angle: number) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  const start = arcPoint(startAngle);
  const end   = arcPoint(endAngle);

  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;

  const fillEndAngle = (135 + 270 * (score / 100)) * (Math.PI / 180);
  const fillEnd = arcPoint(fillEndAngle);
  const largeArc = score > 50 ? 1 : 0;
  const fillPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      {/* Track */}
      <path d={trackPath} fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
      {/* Fill */}
      <path d={fillPath} fill="none" stroke={t.stroke} strokeWidth="10" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${t.stroke}66)` }}
      />
      {/* Score text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="26" fontWeight="700">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="11">/100</text>
    </svg>
  );
}

export default function FishingScoreCard({ score }: Props) {
  const t = THEME[score.label];

  const subcategories: { key: string; label: string; value: number; max: number }[] = [
    { key: "wind",    label: "Wind",     value: score.wind,    max: 30 },
    { key: "tide",    label: "Tide",     value: score.tide,    max: 25 },
    { key: "weather", label: "Weather",  value: score.weather, max: 15 },
    { key: "sunMoon", label: "Sun/Moon", value: score.sunMoon, max: 15 },
    { key: "surf",    label: "Surf",     value: score.surf,    max: 15 },
  ];

  return (
    <div className={`rounded-2xl border border-slate-700/60 bg-slate-800/60 p-5 flex flex-col gap-4 shadow-xl ${t.glow}`}>
      <p className="text-xs uppercase tracking-widest text-slate-400">Current Fishing Rating</p>

      <div className="flex items-center gap-6">
        <ScoreGauge score={score.total} label={score.label} />

        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-3">
            <span className={`text-4xl font-extrabold leading-none ${t.text}`}>{score.label}</span>
            <span className="text-slate-500 text-lg">today</span>
          </div>

          <div className="flex flex-col gap-2">
            {subcategories.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-16 shrink-0">{s.label}</span>
                <div className="flex-1 bg-slate-700/50 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${t.bar}`}
                    style={{ width: `${(s.value / s.max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{s.value}/{s.max}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
