import { TidePrediction, TideMovement } from "@/types/fishing";

const BASE = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

export type TideData = {
  predictions: TidePrediction[];
  nextHigh?: TidePrediction;
  nextLow?: TidePrediction;
  movement: TideMovement;
  currentStatus: string;
};

export async function fetchTides(stationId: string): Promise<TideData> {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

  const params = new URLSearchParams({
    begin_date: fmt(today),
    end_date: fmt(tomorrow),
    station: stationId,
    product: "predictions",
    datum: "MLLW",
    time_zone: "lst_ldt",
    interval: "hilo",
    units: "english",
    application: "pirates_fishing_indicator",
    format: "json",
  });

  const res = await fetch(`${BASE}?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`NOAA tides error: ${res.status}`);
  const data = await res.json();

  const predictions: TidePrediction[] = (data.predictions ?? []).map(
    (p: { t: string; v: string; type: string }) => ({
      t: p.t,
      v: p.v,
      type: p.type as "H" | "L",
    })
  );

  const now = new Date();
  const upcoming = predictions.filter((p) => new Date(p.t) > now);
  const nextHigh = upcoming.find((p) => p.type === "H");
  const nextLow = upcoming.find((p) => p.type === "L");

  // Determine if tide is incoming or outgoing by comparing adjacent predictions
  const movement = determineTideMovement(predictions, now);

  const currentStatus = buildCurrentStatus(movement, nextHigh, nextLow, now);

  return { predictions, nextHigh, nextLow, movement, currentStatus };
}

function determineTideMovement(predictions: TidePrediction[], now: Date): TideMovement {
  if (predictions.length < 2) return "unknown";

  // Find the surrounding high/low tides
  let before: TidePrediction | undefined;
  let after: TidePrediction | undefined;

  for (let i = 0; i < predictions.length; i++) {
    const t = new Date(predictions[i].t);
    if (t <= now) before = predictions[i];
    else if (!after) after = predictions[i];
  }

  if (!before || !after) return "unknown";

  const minutesTotal =
    (new Date(after.t).getTime() - new Date(before.t).getTime()) / 60000;
  const minutesElapsed =
    (now.getTime() - new Date(before.t).getTime()) / 60000;
  const progressPct = minutesElapsed / minutesTotal;

  // Consider slack when within 15% of a turning point
  if (progressPct < 0.15 || progressPct > 0.85) return "slack";

  if (before.type === "L" && after.type === "H") return "incoming";
  if (before.type === "H" && after.type === "L") return "outgoing";
  return "unknown";
}

function buildCurrentStatus(
  movement: TideMovement,
  nextHigh?: TidePrediction,
  nextLow?: TidePrediction,
  now: Date = new Date()
): string {
  const label =
    movement === "incoming"
      ? "Rising tide"
      : movement === "outgoing"
      ? "Falling tide"
      : movement === "slack"
      ? "Slack tide"
      : "Tide status unknown";

  const next = nextHigh && nextLow
    ? new Date(nextHigh.t) < new Date(nextLow.t)
      ? nextHigh
      : nextLow
    : nextHigh ?? nextLow;

  if (!next) return label;

  const mins = Math.round((new Date(next.t).getTime() - now.getTime()) / 60000);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  const nextType = next.type === "H" ? "High" : "Low";
  const timeStr = hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;

  return `${label} — ${nextType} in ${timeStr}`;
}
