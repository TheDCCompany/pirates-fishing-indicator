"use client";

import { useState, useEffect, useCallback } from "react";
import { FishingConditions } from "@/types/fishing";
import WeatherHero from "@/components/WeatherHero";
import FishingScoreCard from "@/components/FishingScoreCard";
import WindCard from "@/components/WindCard";
import TideCard from "@/components/TideCard";
import MoonCard from "@/components/MoonCard";
import SunCard from "@/components/SunCard";
import MarineCard from "@/components/MarineCard";
import SolunarCard from "@/components/SolunarCard";
import LiveCamCard from "@/components/LiveCamCard";

const AUTO_REFRESH_MS = 45 * 60 * 1000;

function formatLastUpdated(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

export default function Dashboard() {
  const [conditions, setConditions] = useState<FishingConditions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fishing-conditions", { cache: "no-store" });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setConditions(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(), AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              ⚓ Pirate&apos;s Fishing Indicator
            </h1>
            <p className="text-xs text-slate-500">Jamaica Beach / Pirates Beach · Galveston, TX</p>
          </div>
          <div className="flex items-center gap-3">
            {conditions && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                {formatDate()} · Updated {formatLastUpdated(conditions.currentTime)}
              </span>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-medium transition-colors"
            >
              <span className={refreshing ? "animate-spin inline-block" : ""}>↻</span>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 rounded-2xl bg-slate-800" />
            <div className="h-44 rounded-2xl bg-slate-800" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-800" />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-700/60 bg-red-900/20 p-5 text-center">
            <p className="text-red-400 font-semibold mb-1">Failed to load conditions</p>
            <p className="text-slate-400 text-sm mb-3">{error}</p>
            <button
              onClick={() => load(true)}
              className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {conditions && !loading && (
          <>
            {/* 1. Current weather strip */}
            <WeatherHero weather={conditions.weather} sun={conditions.sun} />

            {/* 2. Fishing rating */}
            <FishingScoreCard score={conditions.score} />

            {/* 3. Solunar feeding windows */}
            <SolunarCard solunar={conditions.solunar} currentTime={conditions.currentTime} />

            {/* 4. Condition widgets — 4 col grid */}
            {/* Row 1: Wind | Moon | Tide (spans 2) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <WindCard weather={conditions.weather} />
              <MoonCard moon={conditions.moon} />
              <TideCard tide={conditions.tide} />
            </div>

            {/* Row 2: Sun arc (spans 2) | Marine (spans 2) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SunCard sun={conditions.sun} />
              <MarineCard marine={conditions.marine} />
            </div>

            {/* 5. Live cam */}
            <LiveCamCard />
          </>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-5 text-center text-xs text-slate-700">
        Open-Meteo · NOAA Station {conditions?.location.tideStationId ?? "8771510"} · Not for navigation use
      </footer>
    </div>
  );
}
