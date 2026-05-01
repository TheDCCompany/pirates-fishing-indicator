"use client";

import { FishingConditions } from "@/types/fishing";

type Props = { weather: FishingConditions["weather"] };

function windColor(mph: number) {
  if (mph <= 8)  return { text: "text-emerald-400", stroke: "#34d399" };
  if (mph <= 14) return { text: "text-amber-400",   stroke: "#fbbf24" };
  if (mph <= 20) return { text: "text-orange-400",  stroke: "#fb923c" };
  return            { text: "text-red-400",      stroke: "#f87171" };
}

function windLabel(mph: number) {
  if (mph <= 8)  return "Light";
  if (mph <= 14) return "Moderate";
  if (mph <= 20) return "Fresh";
  return "Strong";
}

function CompassRose({ degrees }: { degrees: number }) {
  const cardinals = [
    { label: "N", angle: 0 }, { label: "E", angle: 90 },
    { label: "S", angle: 180 }, { label: "W", angle: 270 },
  ];
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r="42" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      {/* Tick marks */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i * 22.5 - 90) * (Math.PI / 180);
        const r1 = i % 4 === 0 ? 30 : 34;
        const r2 = 42;
        return (
          <line key={i}
            x1={45 + r1 * Math.cos(a)} y1={45 + r1 * Math.sin(a)}
            x2={45 + r2 * Math.cos(a)} y2={45 + r2 * Math.sin(a)}
            stroke={i % 4 === 0 ? "#64748b" : "#1e293b"} strokeWidth="1.5"
          />
        );
      })}
      {/* Cardinal labels */}
      {cardinals.map(({ label, angle }) => {
        const a = (angle - 90) * (Math.PI / 180);
        return (
          <text key={label}
            x={45 + 23 * Math.cos(a)} y={45 + 23 * Math.sin(a) + 4}
            textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600"
          >{label}</text>
        );
      })}
      {/* Wind direction arrow */}
      <g transform={`rotate(${degrees}, 45, 45)`}>
        {/* Arrow tip (points toward wind direction) */}
        <polygon points="45,8 41.5,28 45,24 48.5,28" fill="#f59e0b" />
        {/* Arrow tail */}
        <polygon points="45,82 41.5,62 45,66 48.5,62" fill="#334155" />
      </g>
      <circle cx="45" cy="45" r="3" fill="#f59e0b" />
    </svg>
  );
}

export default function WindCard({ weather }: Props) {
  const { text, stroke } = windColor(weather.windSpeed);
  void stroke;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 flex flex-col items-center gap-3">
      <p className="text-xs uppercase tracking-widest text-slate-400 self-start">Wind</p>

      <CompassRose degrees={weather.windDirection} />

      <div className="text-center">
        <div className={`text-3xl font-bold leading-none ${text}`}>
          {weather.windSpeed}
          <span className="text-base font-normal text-slate-400"> mph</span>
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {weather.windDirectionLabel} · {windLabel(weather.windSpeed)}
        </div>
        {weather.windGust != null && weather.windGust > weather.windSpeed + 3 && (
          <div className="text-xs text-orange-400 mt-1">Gusts {weather.windGust} mph</div>
        )}
      </div>
    </div>
  );
}
