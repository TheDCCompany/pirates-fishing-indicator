// Calculates moon phase using the known New Moon epoch (Jan 6, 2000 18:14 UTC)
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const LUNAR_CYCLE_MS = 29.53058867 * 24 * 60 * 60 * 1000;

export function getMoonPhase(date: Date): {
  phase: string;
  illumination: number;
  emoji: string;
} {
  const elapsed = (date.getTime() - KNOWN_NEW_MOON_MS) % LUNAR_CYCLE_MS;
  const normalised = elapsed < 0 ? elapsed + LUNAR_CYCLE_MS : elapsed;
  const age = normalised / LUNAR_CYCLE_MS; // 0..1

  // Illumination: 0 at new moon, 1 at full moon
  const illumination = Math.round(
    (1 - Math.cos(2 * Math.PI * age)) / 2 * 100
  );

  let phase: string;
  let emoji: string;

  if (age < 0.0625) {
    phase = "New Moon";
    emoji = "🌑";
  } else if (age < 0.1875) {
    phase = "Waxing Crescent";
    emoji = "🌒";
  } else if (age < 0.3125) {
    phase = "First Quarter";
    emoji = "🌓";
  } else if (age < 0.4375) {
    phase = "Waxing Gibbous";
    emoji = "🌔";
  } else if (age < 0.5625) {
    phase = "Full Moon";
    emoji = "🌕";
  } else if (age < 0.6875) {
    phase = "Waning Gibbous";
    emoji = "🌖";
  } else if (age < 0.8125) {
    phase = "Last Quarter";
    emoji = "🌗";
  } else if (age < 0.9375) {
    phase = "Waning Crescent";
    emoji = "🌘";
  } else {
    phase = "New Moon";
    emoji = "🌑";
  }

  return { phase, illumination, emoji };
}
