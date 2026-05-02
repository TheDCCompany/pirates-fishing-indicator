import { NextRequest, NextResponse } from "next/server";
import { fetchWeather, fetchMarine } from "@/lib/api/openMeteo";
import { fetchTides } from "@/lib/api/noaaTides";
import { getMoonPhase } from "@/lib/moonPhase";
import { computeFishingScore, surfLabelFromWaveHeight } from "@/lib/scoring/fishingScore";
import { computeSolunar } from "@/lib/solunar";
import { LOCATION } from "@/lib/location";
import { FishingConditions } from "@/types/fishing";

// Today's date string in America/Chicago (YYYY-MM-DD)
function todayCDT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

// Offset in full days between a CDT date string and today
function dayOffset(dateStr: string): number {
  const todayMs  = new Date(todayCDT() + "T00:00:00Z").getTime();
  const targetMs = new Date(dateStr    + "T00:00:00Z").getTime();
  const offset   = Math.round((targetMs - todayMs) / 86400000);
  return Math.max(0, Math.min(7, offset));
}

// UTC time corresponding to 7 AM America/Chicago on a given date string
function morningUTC(dateStr: string): Date {
  for (const h of [11, 12, 13]) {
    const candidate = new Date(`${dateStr}T${String(h).padStart(2, "0")}:00:00Z`);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago", hour: "numeric", hour12: false,
    }).formatToParts(candidate);
    if (parseInt(parts.find(p => p.type === "hour")?.value ?? "0") === 7)
      return candidate;
  }
  return new Date(`${dateStr}T12:00:00Z`);
}

export async function GET(req: NextRequest) {
  try {
    const dateParam = req.nextUrl.searchParams.get("date") ?? todayCDT();
    const offset    = dayOffset(dateParam);
    const isToday   = offset === 0;

    // For today use current time; for future days use 7 AM CDT on that date
    const targetTime = isToday ? new Date() : morningUTC(dateParam);

    const [weather, marine, tides] = await Promise.all([
      fetchWeather(LOCATION.latitude, LOCATION.longitude, offset),
      fetchMarine(LOCATION.latitude, LOCATION.longitude, offset),
      fetchTides(LOCATION.tideStationId, targetTime),
    ]);

    const moon    = getMoonPhase(targetTime);
    const solunar = computeSolunar(targetTime, LOCATION.latitude, LOCATION.longitude);

    const score = computeFishingScore({
      windSpeed:          weather.windSpeed,
      windDirectionLabel: weather.windDirectionLabel,
      movement:           tides.movement,
      precipitationChance: weather.precipitationChance ?? 0,
      cloudCover:         weather.cloudCover ?? 0,
      temperature:        weather.temperature,
      sunrise:            weather.sunrise,
      waveHeight:         marine.waveHeight,
      moonPhase:          moon.phase,
      targetTime,
    });

    const conditions: FishingConditions = {
      location: {
        name:          LOCATION.name,
        latitude:      LOCATION.latitude,
        longitude:     LOCATION.longitude,
        tideStationId: LOCATION.tideStationId,
      },
      currentTime: targetTime.toISOString(),
      weather: {
        temperature:        weather.temperature,
        windSpeed:          weather.windSpeed,
        windDirection:      weather.windDirection,
        windDirectionLabel: weather.windDirectionLabel,
        windGust:           weather.windGust,
        precipitationChance: weather.precipitationChance,
        cloudCover:         weather.cloudCover,
      },
      sun:   { sunrise: weather.sunrise, sunset: weather.sunset },
      tide: {
        currentStatus: tides.currentStatus,
        nextHigh:      tides.nextHigh,
        nextLow:       tides.nextLow,
        movement:      tides.movement,
        predictions:   tides.predictions,
      },
      moon:   { phase: moon.phase, illumination: moon.illumination, emoji: moon.emoji },
      marine: {
        waveHeight:    marine.waveHeight,
        waveDirection: marine.waveDirection,
        wavePeriod:    marine.wavePeriod,
        surfLabel:     surfLabelFromWaveHeight(marine.waveHeight),
      },
      solunar,
      score: {
        total:   score.total,
        label:   score.label,
        wind:    score.wind,
        tide:    score.tide,
        weather: score.weather,
        sunMoon: score.sunMoon,
        surf:    score.surf,
        reasons: score.reasons,
      },
    };

    return NextResponse.json(conditions);
  } catch (err) {
    console.error("fishing-conditions error:", err);
    return NextResponse.json({ error: "Failed to fetch fishing conditions" }, { status: 500 });
  }
}
