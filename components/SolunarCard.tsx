"use client";

import { useState } from "react";
import { SolunarData, SolunarPeriod } from "@/types/fishing";

type Props = { solunar: SolunarData; currentTime: string };

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Chicago",
  });
}

function fmtShort(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Chicago",
  });
}

type Status = "active" | "upcoming" | "past";

function getStatus(period: SolunarPeriod, now: Date): Status {
  const start = new Date(period.start);
  const end   = new Date(period.end);
  if (now >= start && now <= end) return "active";
  if (now < start) return "upcoming";
  return "past";
}

function timeUntil(iso: string, now: Date): string {
  const ms = new Date(iso).getTime() - now.getTime();
  if (ms <= 0) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// SVG day timeline: show full day bar with period highlighted and now marker
function DayBar({ period, now }: { period: SolunarPeriod; now: Date }) {
  // Day bounds in Central time
  const centralStr = now.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  let dayStart: Date, dayEnd: Date;
  for (let h = 4; h <= 7; h++) {
    const c = new Date(`${centralStr}T${String(h).padStart(2,"0")}:00:00Z`);
    const after  = c.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
    const before = new Date(c.getTime() - 60000).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
    if (after === centralStr && before !== centralStr) {
      dayStart = c;
      dayEnd   = new Date(c.getTime() + 86400000);
      break;
    }
  }
  dayStart ??= new Date(now.setHours(0, 0, 0, 0));
  dayEnd   ??= new Date(dayStart!.getTime() + 86400000);

  const W = 280, H = 18;
  const toX = (d: Date) =>
    Math.max(0, Math.min(W, ((d.getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * W));

  const startX  = toX(new Date(period.start));
  const endX    = toX(new Date(period.end));
  const peakX   = toX(new Date(period.peak));
  const nowX    = toX(now);
  const isMajor = period.type === "major";
  const barColor = isMajor ? "#f59e0b" : "#38bdf8";

  return (
    <svg width={W} height={H + 14} viewBox={`0 0 ${W} ${H + 14}`} className="w-full">
      {/* Hour ticks */}
      {Array.from({ length: 7 }).map((_, i) => {
        const x = (i / 6) * W;
        const label = ["12a", "4a", "8a", "12p", "4p", "8p", "12a"][i];
        return (
          <g key={i}>
            <line x1={x} y1={0} x2={x} y2={H} stroke="#1e293b" strokeWidth="1" />
            <text x={x} y={H + 12} textAnchor="middle" fill="#475569" fontSize="8">{label}</text>
          </g>
        );
      })}

      {/* Track */}
      <rect x={0} y={4} width={W} height={H - 8} rx="3" fill="#1e293b" />

      {/* Period window */}
      <rect x={startX} y={4} width={Math.max(2, endX - startX)} height={H - 8} rx="3"
        fill={barColor} fillOpacity="0.25" />

      {/* Peak marker */}
      <rect x={peakX - 1.5} y={2} width={3} height={H - 4} rx="1.5" fill={barColor}
        style={{ filter: `drop-shadow(0 0 3px ${barColor})` }} />

      {/* Now marker */}
      {nowX >= 0 && nowX <= W && (
        <line x1={nowX} y1={0} x2={nowX} y2={H} stroke="#f472b6" strokeWidth="1.5" strokeDasharray="2 2" />
      )}
    </svg>
  );
}

const MAJOR_THEME = {
  tab:     "bg-amber-500/20 border-amber-500/60 text-amber-300",
  tabIdle: "border-slate-700/60 text-slate-400 hover:border-amber-500/40 hover:text-amber-300",
  badge:   "bg-amber-500/20 text-amber-300 border-amber-500/40",
  accent:  "text-amber-400",
  dot:     "bg-amber-400",
};
const MINOR_THEME = {
  tab:     "bg-sky-500/20 border-sky-500/60 text-sky-300",
  tabIdle: "border-slate-700/60 text-slate-400 hover:border-sky-500/40 hover:text-sky-300",
  badge:   "bg-sky-500/20 text-sky-300 border-sky-500/40",
  accent:  "text-sky-400",
  dot:     "bg-sky-400",
};

export default function SolunarCard({ solunar, currentTime }: Props) {
  const now = new Date(currentTime);
  const [activeTab, setActiveTab] = useState(0);

  const { periods } = solunar;
  if (!periods.length) return null;

  // Auto-select the active or next upcoming period on first render
  const defaultTab = (() => {
    const activeIdx = periods.findIndex(p => getStatus(p, now) === "active");
    if (activeIdx >= 0) return activeIdx;
    const upcomingIdx = periods.findIndex(p => getStatus(p, now) === "upcoming");
    return upcomingIdx >= 0 ? upcomingIdx : 0;
  })();

  const tabIndex = activeTab ?? defaultTab;
  const period = periods[tabIndex];
  const status = getStatus(period, now);
  const theme  = period.type === "major" ? MAJOR_THEME : MINOR_THEME;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-slate-400">Solunar Feeding Windows</p>
        <span className="text-lg">🌙</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {periods.map((p, i) => {
          const t     = p.type === "major" ? MAJOR_THEME : MINOR_THEME;
          const s     = getStatus(p, now);
          const isSelected = i === tabIndex;
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                isSelected ? t.tab : t.tabIdle
              }`}
            >
              <span className="font-semibold">{fmtShort(p.peak)}</span>
              <span className="opacity-75">{p.type === "major" ? "● Major" : "○ Minor"}</span>
              {s === "active" && (
                <span className="text-[9px] text-emerald-400 font-bold tracking-wider">LIVE</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Period detail */}
      <div className="flex flex-col gap-3">
        {/* Type badge + label */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wide ${theme.badge}`}>
            {period.type === "major" ? "★ Major" : "○ Minor"}
          </span>
          <span className="text-sm text-slate-300">{period.label}</span>
          <span className="text-xs text-slate-500">· {period.durationMinutes} min window</span>
        </div>

        {/* Times row */}
        <div className="flex items-center gap-2 text-center">
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-0.5">Start</div>
            <div className="text-sm font-medium text-slate-300">{fmtTime(period.start)}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-0.5">Peak</div>
            <div className={`text-xl font-bold ${theme.accent}`}>{fmtTime(period.peak)}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-0.5">End</div>
            <div className="text-sm font-medium text-slate-300">{fmtTime(period.end)}</div>
          </div>
        </div>

        {/* Day timeline bar */}
        <DayBar period={period} now={now} />

        {/* Status */}
        <div className="flex items-center gap-2">
          {status === "active" && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Active now
            </span>
          )}
          {status === "upcoming" && (
            <span className={`text-sm font-medium ${theme.accent}`}>
              Starts in {timeUntil(period.start, now)}
            </span>
          )}
          {status === "past" && (
            <span className="text-sm text-slate-500">Period has passed</span>
          )}
        </div>
      </div>
    </div>
  );
}
