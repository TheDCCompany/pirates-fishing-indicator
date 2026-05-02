import { TideMovement, SurfLabel, FishingLabel } from "@/types/fishing";

type ScoreInput = {
  windSpeed: number;
  windDirectionLabel: string;
  movement: TideMovement;
  precipitationChance: number;
  cloudCover: number;
  temperature: number;
  sunrise: string;
  waveHeight?: number;
  moonPhase: string;
  targetTime?: Date; // defaults to now; use future morning time for forecast days
};

type ScoreResult = {
  total: number;
  label: FishingLabel;
  wind: number;
  tide: number;
  weather: number;
  sunMoon: number;
  surf: number;
  reasons: string[];
};

const FAVORABLE_DIRS   = new Set(["N", "NNE", "NNW", "NE", "NW"]);
const UNFAVORABLE_DIRS = new Set(["S", "SSE", "SE", "ESE"]);

export function computeFishingScore(input: ScoreInput): ScoreResult {
  const ref = input.targetTime ?? new Date();
  const reasons: string[] = [];

  // --- Wind (30 pts) ---
  let wind = 0;
  const { windSpeed, windDirectionLabel: dir } = input;
  if (windSpeed <= 8)  wind = 28;
  else if (windSpeed <= 14) wind = 18;
  else if (windSpeed <= 20) wind = 8;
  else wind = 2;

  if (FAVORABLE_DIRS.has(dir)) {
    wind = Math.min(30, wind + 2);
    reasons.push(`${dir} wind keeps surf cleaner — favorable for Galveston surf fishing.`);
  } else if (UNFAVORABLE_DIRS.has(dir)) {
    wind = Math.max(0, wind - 3);
    reasons.push(`${dir} wind churns up surf and reduces water clarity.`);
  }

  if (windSpeed <= 8)       reasons.push(`Light wind (${windSpeed} mph) — ideal casting and bait presentation.`);
  else if (windSpeed <= 14) reasons.push(`Moderate wind (${windSpeed} mph) — manageable for surf fishing.`);
  else if (windSpeed <= 20) reasons.push(`Elevated wind (${windSpeed} mph) — expect chop and harder casting.`);
  else                      reasons.push(`Strong wind (${windSpeed} mph) — rough conditions on the beach.`);

  // --- Tide (25 pts) ---
  let tide = 0;
  const { movement } = input;

  let inMorningWindow = false;
  if (input.sunrise) {
    const sr = new Date(input.sunrise);
    inMorningWindow = ref >= new Date(sr.getTime() - 30 * 60000) &&
                      ref <= new Date(sr.getTime() + 2 * 3600000);
  }

  if (movement === "incoming") {
    tide = inMorningWindow ? 25 : 20;
    reasons.push("Incoming tide pushes baitfish toward shore — strong positive for surf fishing.");
  } else if (movement === "outgoing") {
    tide = inMorningWindow ? 15 : 12;
    reasons.push("Outgoing tide — fish may hold in troughs; still fishable.");
  } else if (movement === "slack") {
    tide = 8;
    reasons.push("Slack tide — fish activity typically lower around tide change.");
  } else {
    tide = 10;
  }

  // --- Weather (15 pts) ---
  let weather = 0;
  const { precipitationChance, cloudCover, temperature } = input;

  if (precipitationChance <= 10)      weather = 13;
  else if (precipitationChance <= 30) weather = 9;
  else if (precipitationChance <= 60) weather = 4;
  else { weather = 1; reasons.push("High rain chance — expect rough/unsafe beach conditions."); }

  if (temperature < 45 || temperature > 98) {
    weather = Math.max(0, weather - 2);
    reasons.push(`Extreme temperature (${temperature}°F) may suppress fish and angler activity.`);
  }

  if (cloudCover > 80 && precipitationChance <= 20)
    reasons.push("Overcast sky can reduce fish wariness near the surf.");

  if (precipitationChance <= 10)
    reasons.push(`Clear conditions (${precipitationChance}% rain chance) — comfortable morning on the beach.`);

  // --- Sun / Moon (15 pts) ---
  let sunMoon = 0;
  let sunMoonReason = "";

  if (input.sunrise) {
    const sr = new Date(input.sunrise);
    const mins = (ref.getTime() - sr.getTime()) / 60000;
    if (mins >= -30 && mins <= 90)      { sunMoon = 13; sunMoonReason = "Golden hour — fish are most active in the first 90 minutes after sunrise."; }
    else if (mins > 90 && mins <= 180) { sunMoon = 8;  sunMoonReason = "Morning window — still a good time to fish before midday sun."; }
    else if (mins < -30)               { sunMoon = 10; sunMoonReason = "Pre-sunrise — fish are feeding in low-light conditions."; }
    else                               { sunMoon = 5; }
  } else {
    sunMoon = 7;
  }

  const { moonPhase } = input;
  if (moonPhase === "Full Moon" || moonPhase === "New Moon") {
    sunMoon = Math.min(15, sunMoon + 2);
    sunMoonReason += ` ${moonPhase} aligns with stronger solunar feeding windows.`;
  }
  if (sunMoonReason) reasons.push(sunMoonReason.trim());

  // --- Surf (15 pts) ---
  let surf = 0;
  const wh = input.waveHeight;
  if (wh == null) {
    surf = 8;
    reasons.push("Marine data unavailable — surf conditions unknown.");
  } else if (wh <= 1.5) {
    surf = 15;
    reasons.push(`Wave height ${wh} ft — calm surf ideal for wade fishing and bait presentation.`);
  } else if (wh <= 3) {
    surf = 9;
    reasons.push(`Wave height ${wh} ft — fishable surf with some chop.`);
  } else {
    surf = 2;
    reasons.push(`Wave height ${wh} ft — rough surf makes bait control difficult.`);
  }

  const total = Math.min(100, wind + tide + weather + sunMoon + surf);
  const label: FishingLabel = total >= 75 ? "Good" : total >= 50 ? "Fair" : "Poor";

  return { total, label, wind, tide, weather, sunMoon, surf, reasons };
}

export function surfLabelFromWaveHeight(waveHeight?: number): SurfLabel {
  if (waveHeight == null) return "fishable";
  if (waveHeight <= 1.5)  return "calm";
  if (waveHeight <= 3)    return "fishable";
  return "rough";
}
