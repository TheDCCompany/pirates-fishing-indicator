"use client";

import { FishingConditions } from "@/types/fishing";

type Props = { marine: FishingConditions["marine"] };

const SURF = {
  calm:     { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/40", label: "Calm",     icon: "🏄", bar: "bg-emerald-400" },
  fishable: { color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/40",     label: "Fishable", icon: "🎣", bar: "bg-amber-400"   },
  rough:    { color: "text-red-400",     bg: "bg-red-500/15 border-red-500/40",         label: "Rough",    icon: "⚠️", bar: "bg-red-500"     },
} as const;

function waveDir(deg?: number): string {
  if (deg == null) return "—";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Wave height visual bar (max = 6 ft for display)
function WaveBar({ height }: { height?: number }) {
  if (height == null) return null;
  const pct = Math.min(100, (height / 6) * 100);
  const color = height <= 1.5 ? "bg-emerald-400" : height <= 3 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-end gap-1 h-10">
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => {
        const barH = Math.min(100, pct * scale);
        return (
          <div key={i} className="w-2 rounded-sm bg-slate-700/60 relative" style={{ height: "40px" }}>
            <div
              className={`absolute bottom-0 w-full rounded-sm ${color}`}
              style={{ height: `${barH}%`, opacity: 0.5 + i * 0.1 }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function MarineCard({ marine }: Props) {
  const key = marine.surfLabel ?? "fishable";
  const cfg = SURF[key];

  return (
    <div className="col-span-2 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 flex flex-col gap-3">
      <p className="text-xs uppercase tracking-widest text-slate-400">Surf</p>

      {/* Surf label badge */}
      <div className={`flex items-center gap-3 rounded-xl border p-3 ${cfg.bg}`}>
        <span className="text-2xl">{cfg.icon}</span>
        <span className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</span>
      </div>

      <div className="flex items-end justify-between gap-4">
        {/* Wave bar visual */}
        <WaveBar height={marine.waveHeight} />

        {/* Stats */}
        <div className="flex gap-4 text-center">
          <div>
            <div className={`text-2xl font-bold leading-none ${cfg.color}`}>
              {marine.waveHeight != null ? marine.waveHeight : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">ft</div>
          </div>
          <div>
            <div className="text-2xl font-bold leading-none text-slate-300">{waveDir(marine.waveDirection)}</div>
            <div className="text-xs text-slate-500 mt-0.5">from</div>
          </div>
          <div>
            <div className="text-2xl font-bold leading-none text-slate-300">
              {marine.wavePeriod != null ? Math.round(marine.wavePeriod) : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">sec</div>
          </div>
        </div>
      </div>
    </div>
  );
}
