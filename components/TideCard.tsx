"use client";

import { FishingConditions, TidePrediction } from "@/types/fishing";

type Props = { tide: FishingConditions["tide"] };

function formatTideTime(t: string): string {
  return new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// Mini sparkline of today's tide curve using cubic bezier through hi/lo points
function TideSparkline({ predictions }: { predictions?: TidePrediction[] }) {
  if (!predictions || predictions.length < 2) return null;

  const W = 220, H = 52;
  const now = new Date();

  // Filter to a ±18hr window centered on now
  const windowStart = new Date(now.getTime() - 9 * 3600000);
  const windowEnd   = new Date(now.getTime() + 9 * 3600000);
  const pts = predictions.filter(p => {
    const t = new Date(p.t);
    return t >= windowStart && t <= windowEnd;
  });
  if (pts.length < 2) return null;

  const values = pts.map(p => parseFloat(p.v));
  const times  = pts.map(p => new Date(p.t).getTime());
  const minV = Math.min(...values) - 0.2;
  const maxV = Math.max(...values) + 0.2;
  const minT = times[0];
  const maxT = times[times.length - 1];

  const toX = (t: number) => ((t - minT) / (maxT - minT)) * W;
  const toY = (v: number) => H - ((v - minV) / (maxV - minV)) * H;

  // Build smooth path with cubic bezier
  const coords = pts.map((p, i) => ({ x: toX(times[i]), y: toY(parseFloat(p.v)) }));
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Now marker
  const nowX = toX(now.getTime());
  const nowPct = (now.getTime() - minT) / (maxT - minT);
  const showNow = nowPct >= 0 && nowPct <= 1;

  return (
    <svg width={W} height={H + 10} viewBox={`0 0 ${W} ${H + 10}`} className="w-full">
      {/* Area fill */}
      <defs>
        <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`${d} V ${H} H ${coords[0].x} Z`} fill="url(#tideGrad)" />
      <path d={d} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Now line */}
      {showNow && (
        <>
          <line x1={nowX} y1={0} x2={nowX} y2={H} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx={nowX} cy={H / 2} r="3" fill="#f59e0b" />
        </>
      )}
    </svg>
  );
}

function movementConfig(movement: FishingConditions["tide"]["movement"]) {
  if (movement === "incoming") return { icon: "↑", color: "text-emerald-400", label: "Rising" };
  if (movement === "outgoing") return { icon: "↓", color: "text-amber-400",   label: "Falling" };
  if (movement === "slack")    return { icon: "→", color: "text-slate-400",   label: "Slack" };
  return { icon: "?", color: "text-slate-500", label: "Unknown" };
}

export default function TideCard({ tide }: Props) {
  const mv = movementConfig(tide.movement);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 flex flex-col gap-3 col-span-2">
      <p className="text-xs uppercase tracking-widest text-slate-400">Tide</p>

      <TideSparkline predictions={tide.predictions} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-bold ${mv.color}`}>{mv.icon}</span>
          <span className={`text-lg font-semibold ${mv.color}`}>{mv.label}</span>
        </div>

        <div className="flex gap-5 text-center">
          {tide.nextHigh && (
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Next High</div>
              <div className="text-sm font-semibold text-slate-200">{formatTideTime(tide.nextHigh.t)}</div>
              <div className="text-xs text-sky-400">{parseFloat(tide.nextHigh.v).toFixed(1)} ft</div>
            </div>
          )}
          {tide.nextLow && (
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Next Low</div>
              <div className="text-sm font-semibold text-slate-200">{formatTideTime(tide.nextLow.t)}</div>
              <div className="text-xs text-slate-400">{parseFloat(tide.nextLow.v).toFixed(1)} ft</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
