import { NextResponse } from "next/server";
import { fetchWeather, fetchMarine } from "@/lib/api/openMeteo";
import { fetchTides } from "@/lib/api/noaaTides";
import { getMoonPhase } from "@/lib/moonPhase";
import { computeFishingScore, surfLabelFromWaveHeight } from "@/lib/scoring/fishingScore";
import { computeSolunar } from "@/lib/solunar";
import { LOCATION } from "@/lib/location";
import { FishingConditions } from "@/types/fishing";

export async function GET() {
  try {
    const [weather, marine, tides] = await Promise.all([
      fetchWeather(LOCATION.latitude, LOCATION.longitude),
      fetchMarine(LOCATION.latitude, LOCATION.longitude),
      fetchTides(LOCATION.tideStationId),
    ]);

    const now  = new Date();
    const moon = getMoonPhase(now);
    const solunar = computeSolunar(now, LOCATION.latitude, LOCATION.longitude);

    const score = computeFishingScore({
      windSpeed: weather.windSpeed,
      windDirectionLabel: weather.windDirectionLabel,
      movement: tides.movement,
      precipitationChance: weather.precipitationChance ?? 0,
      cloudCover: weather.cloudCover ?? 0,
      temperature: weather.temperature,
      sunrise: weather.sunrise,
      waveHeight: marine.waveHeight,
      moonPhase: moon.phase,
    });


    const conditions: FishingConditions = {
      location: {
        name: LOCATION.name,
        latitude: LOCATION.latitude,
        longitude: LOCATION.longitude,
        tideStationId: LOCATION.tideStationId,
      },
      currentTime: new Date().toISOString(),
      weather: {
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        windDirectionLabel: weather.windDirectionLabel,
        windGust: weather.windGust,
        precipitationChance: weather.precipitationChance,
        cloudCover: weather.cloudCover,
      },
      sun: {
        sunrise: weather.sunrise,
        sunset: weather.sunset,
      },
      tide: {
        currentStatus: tides.currentStatus,
        nextHigh: tides.nextHigh,
        nextLow: tides.nextLow,
        movement: tides.movement,
        predictions: tides.predictions,
      },
      moon: {
        phase: moon.phase,
        illumination: moon.illumination,
        emoji: moon.emoji,
      },
      marine: {
        waveHeight: marine.waveHeight,
        waveDirection: marine.waveDirection,
        wavePeriod: marine.wavePeriod,
        surfLabel: surfLabelFromWaveHeight(marine.waveHeight),
      },
      solunar,
      score: {
        total: score.total,
        label: score.label,
        wind: score.wind,
        tide: score.tide,
        weather: score.weather,
        sunMoon: score.sunMoon,
        surf: score.surf,
        reasons: score.reasons,
      },
    };

    return NextResponse.json(conditions);
  } catch (err) {
    console.error("fishing-conditions error:", err);
    return NextResponse.json(
      { error: "Failed to fetch fishing conditions" },
      { status: 500 }
    );
  }
}
