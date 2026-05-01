export type TideMovement = "incoming" | "outgoing" | "slack" | "unknown";
export type SurfLabel = "calm" | "fishable" | "rough";
export type FishingLabel = "Good" | "Fair" | "Poor";

export type TidePrediction = {
  t: string;
  v: string;
  type: "H" | "L";
};

export type SolunarPeriod = {
  type: "major" | "minor";
  label: string;
  start: string;
  peak: string;
  end: string;
  durationMinutes: number;
};

export type SolunarData = {
  periods: SolunarPeriod[];
};

export type FishingConditions = {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    tideStationId: string;
  };
  currentTime: string;
  weather: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    windDirectionLabel: string;
    windGust?: number;
    precipitationChance?: number;
    cloudCover?: number;
  };
  sun: {
    sunrise: string;
    sunset: string;
  };
  tide: {
    currentStatus?: string;
    nextHigh?: TidePrediction;
    nextLow?: TidePrediction;
    movement?: TideMovement;
    predictions?: TidePrediction[];
  };
  moon: {
    phase: string;
    illumination: number;
    emoji: string;
  };
  marine: {
    waveHeight?: number;
    waveDirection?: number;
    wavePeriod?: number;
    surfLabel?: SurfLabel;
  };
  score: {
    total: number;
    label: FishingLabel;
    wind: number;
    tide: number;
    weather: number;
    sunMoon: number;
    surf: number;
    reasons: string[];
  };
  solunar: SolunarData;
};
