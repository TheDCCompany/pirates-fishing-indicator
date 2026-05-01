"use client";

import { FishingConditions } from "@/types/fishing";

type Props = {
  weather: FishingConditions["weather"];
  sun: FishingConditions["sun"];
};

function formatTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function tempColor(f: number) {
  if (f < 50) return "text-blue-400";
  if (f < 70) return "text-sky-300";
  if (f < 85) return "text-amber-300";
  return "text-red-400";
}

function windColor(mph: number) {
  if (mph <= 8) return "text-emerald-400";
  if (mph <= 14) return "text-amber-400";
  if (mph <= 20) return "text-orange-400";
  return "text-red-400";
}

function precipColor(pct: number) {
  if (pct <= 20) return "text-emerald-400";
  if (pct <= 50) return "text-amber-400";
  return "text-red-400";
}

// Minimal SVG compass arrow — points in wind direction
function WindCompass({ degrees }: { degrees: number }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
      {/* Outer ring */}
      <circle cx="22" cy="22" r="20" fill="none" stroke="#334155" strokeWidth="1.5" />
      {/* Cardinal marks */}
      {[0, 90, 180, 270].map((a) => {
        const rad = (a - 90) * (Math.PI / 180);
        const x1 = 22 + 15 * Math.cos(rad);
        const y1 = 22 + 15 * Math.sin(rad);
        const x2 = 22 + 20 * Math.cos(rad);
        const y2 = 22 + 20 * Math.sin(rad);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="1.5" />;
      })}
      {/* Arrow pointing wind direction */}
      <g transform={`rotate(${degrees}, 22, 22)`}>
        <polygon points="22,4 19,22 22,19 25,22" fill="#f59e0b" />
        <polygon points="22,40 19,22 22,25 25,22" fill="#334155" />
      </g>
      {/* Center dot */}
      <circle cx="22" cy="22" r="2" fill="#f59e0b" />
    </svg>
  );
}

export default function WeatherHero({ weather, sun }: Props) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">

        {/* Temperature */}
        <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
          <span className="text-2xl">🌡️</span>
          <span className={`text-3xl font-bold leading-none ${tempColor(weather.temperature)}`}>
            {weather.temperature}°
          </span>
          <span className="text-xs text-slate-500">Feels like {weather.temperature}°F</span>
        </div>

        <div className="w-px h-12 bg-slate-700/60 hidden sm:block" />

        {/* Wind */}
        <div className="flex items-center gap-3">
          <WindCompass degrees={weather.windDirection} />
          <div className="flex flex-col gap-0.5">
            <span className={`text-2xl font-bold leading-none ${windColor(weather.windSpeed)}`}>
              {weather.windSpeed} <span className="text-base font-normal text-slate-400">mph</span>
            </span>
            <span className="text-sm text-slate-400">{weather.windDirectionLabel}</span>
            {weather.windGust != null && weather.windGust > weather.windSpeed + 3 && (
              <span className="text-xs text-orange-400">Gusts {weather.windGust} mph</span>
            )}
          </div>
        </div>

        <div className="w-px h-12 bg-slate-700/60 hidden sm:block" />

        {/* Rain */}
        <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
          <span className="text-2xl">🌧️</span>
          <span className={`text-2xl font-bold leading-none ${precipColor(weather.precipitationChance ?? 0)}`}>
            {weather.precipitationChance ?? 0}%
          </span>
          <span className="text-xs text-slate-500">Rain</span>
        </div>

        <div className="w-px h-12 bg-slate-700/60 hidden sm:block" />

        {/* Cloud cover */}
        <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
          <span className="text-2xl">☁️</span>
          <span className="text-2xl font-bold leading-none text-slate-300">
            {weather.cloudCover ?? 0}%
          </span>
          <span className="text-xs text-slate-500">Cloud</span>
        </div>

        <div className="w-px h-12 bg-slate-700/60 hidden sm:block" />

        {/* Sunrise / Sunset */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl">🌅</span>
            <span className="text-base font-semibold text-amber-300">{formatTime(sun.sunrise)}</span>
            <span className="text-xs text-slate-500">Sunrise</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl">🌇</span>
            <span className="text-base font-semibold text-orange-300">{formatTime(sun.sunset)}</span>
            <span className="text-xs text-slate-500">Sunset</span>
          </div>
        </div>

      </div>
    </div>
  );
}
