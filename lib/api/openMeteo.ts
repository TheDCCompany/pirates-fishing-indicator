const WEATHER_BASE = "https://api.open-meteo.com/v1/forecast";
const MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";

// WMO wind direction to compass label
export function windDirectionLabel(degrees: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return dirs[index];
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

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "cloud_cover",
    ].join(","),
    hourly: "precipitation_probability",
    daily: ["sunrise", "sunset"].join(","),
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "America/Chicago",
    forecast_days: "1",
  });

  const res = await fetch(`${WEATHER_BASE}?${params}`, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`Open-Meteo weather error: ${res.status}`);
  const data = await res.json();

  const current = data.current;
  // Pick precipitation probability for the current hour
  const now = new Date();
  const hourIndex = now.getHours();
  const precipChance = data.hourly?.precipitation_probability?.[hourIndex] ?? 0;

  const dir = current.wind_direction_10m ?? 0;

  return {
    temperature: Math.round(current.temperature_2m ?? 0),
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    windDirection: dir,
    windDirectionLabel: windDirectionLabel(dir),
    windGust: Math.round(current.wind_gusts_10m ?? 0),
    precipitationChance: precipChance,
    cloudCover: current.cloud_cover ?? 0,
    sunrise: data.daily?.sunrise?.[0] ?? "",
    sunset: data.daily?.sunset?.[0] ?? "",
  };
}

export type MarineData = {
  waveHeight?: number;
  waveDirection?: number;
  wavePeriod?: number;
};

export async function fetchMarine(lat: number, lon: number): Promise<MarineData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: ["wave_height", "wave_direction", "wave_period"].join(","),
    timezone: "America/Chicago",
    forecast_days: "1",
  });

  try {
    const res = await fetch(`${MARINE_BASE}?${params}`, { next: { revalidate: 1800 } });
    if (!res.ok) return {};
    const data = await res.json();

    const now = new Date();
    const hourIndex = now.getHours();
    const waveHeight = data.hourly?.wave_height?.[hourIndex];
    const waveDirection = data.hourly?.wave_direction?.[hourIndex];
    const wavePeriod = data.hourly?.wave_period?.[hourIndex];

    return {
      waveHeight: waveHeight != null ? Math.round(waveHeight * 3.281 * 10) / 10 : undefined, // m to ft
      waveDirection: waveDirection ?? undefined,
      wavePeriod: wavePeriod ?? undefined,
    };
  } catch {
    return {};
  }
}
