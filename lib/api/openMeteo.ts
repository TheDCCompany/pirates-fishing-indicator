const WEATHER_BASE = "https://api.open-meteo.com/v1/forecast";
const MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";

export function windDirectionLabel(degrees: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(degrees / 22.5) % 16];
}

// Returns the current hour (0-23) in America/Chicago
function centralHour(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const h = parseInt(parts.find(p => p.type === "hour")?.value ?? "7");
  return isNaN(h) ? 7 : h % 24;
}

export type WeatherData = {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  windDirectionLabel: string;
  windGust: number;
  precipitationChance: number;
  cloudCover: number;
  sunrise: string;
  sunset: string;
};

export async function fetchWeather(lat: number, lon: number, dayOffset = 0): Promise<WeatherData> {
  const forecastDays = dayOffset + 2;
  // Today: actual CDT hour. Future: 7 AM (prime morning fishing hour for scoring)
  const localHour = dayOffset === 0 ? centralHour(new Date()) : 7;
  const hourIndex = dayOffset * 24 + localHour;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      "temperature_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "cloud_cover",
      "precipitation_probability",
    ].join(","),
    daily: ["sunrise", "sunset"].join(","),
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "America/Chicago",
    forecast_days: String(forecastDays),
  });

  const res = await fetch(`${WEATHER_BASE}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Open-Meteo weather error: ${res.status}`);
  const data = await res.json();

  const h = data.hourly;
  const dir = h.wind_direction_10m?.[hourIndex] ?? 0;

  return {
    temperature:       Math.round(h.temperature_2m?.[hourIndex] ?? 0),
    windSpeed:         Math.round(h.wind_speed_10m?.[hourIndex] ?? 0),
    windDirection:     dir,
    windDirectionLabel: windDirectionLabel(dir),
    windGust:          Math.round(h.wind_gusts_10m?.[hourIndex] ?? 0),
    precipitationChance: h.precipitation_probability?.[hourIndex] ?? 0,
    cloudCover:        h.cloud_cover?.[hourIndex] ?? 0,
    sunrise:           data.daily?.sunrise?.[dayOffset] ?? "",
    sunset:            data.daily?.sunset?.[dayOffset] ?? "",
  };
}

export type MarineData = {
  waveHeight?: number;
  waveDirection?: number;
  wavePeriod?: number;
};

export async function fetchMarine(lat: number, lon: number, dayOffset = 0): Promise<MarineData> {
  const forecastDays = dayOffset + 2;
  const localHour = dayOffset === 0 ? centralHour(new Date()) : 7;
  const hourIndex = dayOffset * 24 + localHour;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: ["wave_height", "wave_direction", "wave_period"].join(","),
    timezone: "America/Chicago",
    forecast_days: String(Math.min(forecastDays, 7)), // marine max is 7 days
  });

  try {
    const res = await fetch(`${MARINE_BASE}?${params}`, { cache: "no-store" });
    if (!res.ok) return {};
    const data = await res.json();
    const h = data.hourly;
    const safeIdx = Math.min(hourIndex, (h.wave_height?.length ?? 1) - 1);
    const waveHeight = h.wave_height?.[safeIdx];
    return {
      waveHeight:   waveHeight != null ? Math.round(waveHeight * 3.281 * 10) / 10 : undefined,
      waveDirection: h.wave_direction?.[safeIdx] ?? undefined,
      wavePeriod:    h.wave_period?.[safeIdx] ?? undefined,
    };
  } catch {
    return {};
  }
}
