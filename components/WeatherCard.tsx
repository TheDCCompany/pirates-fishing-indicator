"use client";

import { FishingConditions } from "@/types/fishing";

type Props = { weather: FishingConditions["weather"] };

function tempColor(f: number): string {
  if (f < 50) return "text-blue-400";
  if (f < 70) return "text-emerald-400";
  if (f < 85) return "text-amber-400";
  return "text-red-400";
}

function precipColor(pct: number): string {
  if (pct <= 20) return "text-emerald-400";
  if (pct <= 50) return "text-amber-400";
  return "text-red-400";
}

export default function WeatherCard({ weather }: Props) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-slate-400">Weather</p>
        <span className="text-xl">🌤️</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col items-center gap-1 bg-slate-700/30 rounded-xl p-3">
          <span className="text-xs text-slate-400">Temp</span>
          <span className={`text-2xl font-bold ${tempColor(weather.temperature)}`}>{weather.temperature}°</span>
          <span className="text-xs text-slate-500">F</span>
        </div>
        <div className="flex flex-col items-center gap-1 bg-slate-700/30 rounded-xl p-3">
          <span className="text-xs text-slate-400">Rain</span>
          <span className={`text-2xl font-bold ${precipColor(weather.precipitationChance ?? 0)}`}>
            {weather.precipitationChance ?? 0}%
          </span>
          <span className="text-xs text-slate-500">chance</span>
        </div>
        <div className="flex flex-col items-center gap-1 bg-slate-700/30 rounded-xl p-3">
          <span className="text-xs text-slate-400">Cloud</span>
          <span className="text-2xl font-bold text-slate-300">{weather.cloudCover ?? 0}%</span>
          <span className="text-xs text-slate-500">cover</span>
        </div>
      </div>

      <div className="text-xs text-slate-500 border-t border-slate-700/50 pt-2">
        {(weather.precipitationChance ?? 0) <= 20
          ? "Clear skies — comfortable fishing conditions expected."
          : (weather.precipitationChance ?? 0) <= 50
          ? "Partly cloudy — possible light showers; watch the radar."
          : "Storm potential — prioritize safety on the beach."}
      </div>
    </div>
  );
}
