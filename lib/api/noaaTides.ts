import { TidePrediction, TideMovement } from "@/types/fishing";

const BASE = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

export type TideData = {
  predictions: TidePrediction[];
  nextHigh?: TidePrediction;
  nextLow?: TidePrediction;
  movement: TideMovement;
  currentStatus: string;
};

const fmt = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

export async function fetchTides(stationId: string, targetTime?: Date): Promise<TideData> {
  const ref = targetTime ?? new Date();

  // Fetch target day + next day to cover full tidal cycle
  const dayAfter = new Date(ref);
  dayAfter.setDate(ref.getDate() + 1);

  const params = new URLSearchParams({
    begin_date: fmt(ref),
    end_date:   fmt(dayAfter),
    station:    stationId,
    product:    "predictions",
    datum:      "MLLW",
    time_zone:  "lst_ldt",
    interval:   "hilo",
    units:      "english",
    application: "pirates_fishing_indicator",
    format:     "json",
  });

  const res = await fetch(`${BASE}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`NOAA tides error: ${res.status}`);
  const data = await res.json();

  const predictions: TidePrediction[] = (data.predictions ?? []).map(
    (p: { t: string; v: string; type: string }) => ({
      t: p.t, v: p.v, type: p.type as "H" | "L",
    })
  );

  const upcoming = predictions.filter(p => new Date(p.t) > ref);
  const nextHigh = upcoming.find(p => p.type === "H");
  const nextLow  = upcoming.find(p => p.type === "L");
  const movement = determineTideMovement(predictions, ref);
  const currentStatus = buildCurrentStatus(movement, nextHigh, nextLow, ref);

  return { predictions, nextHigh, nextLow, movement, currentStatus };
}

function determineTideMovement(predictions: TidePrediction[], ref: Date): TideMovement {
  if (predictions.length < 2) return "unknown";

  let before: TidePrediction | undefined;
  let after:  TidePrediction | undefined;

  for (const p of predictions) {
    if (new Date(p.t) <= ref) before = p;
    else if (!after) after = p;
  }

  if (!before || !after) return "unknown";

  const total   = (new Date(after.t).getTime() - new Date(before.t).getTime()) / 60000;
  const elapsed = (ref.getTime() - new Date(before.t).getTime()) / 60000;
  const pct = elapsed / total;

  if (pct < 0.15 || pct > 0.85) return "slack";
  if (before.type === "L" && after.type === "H") return "incoming";
  if (before.type === "H" && after.type === "L") return "outgoing";
  return "unknown";
}

function buildCurrentStatus(
  movement: TideMovement,
  nextHigh?: TidePrediction,
  nextLow?: TidePrediction,
  ref: Date = new Date()
): string {
  const label =
    movement === "incoming" ? "Rising tide"  :
    movement === "outgoing" ? "Falling tide" :
    movement === "slack"    ? "Slack tide"   : "Tide unknown";

  const next = nextHigh && nextLow
    ? (new Date(nextHigh.t) < new Date(nextLow.t) ? nextHigh : nextLow)
    : (nextHigh ?? nextLow);

  if (!next) return label;

  const mins = Math.round((new Date(next.t).getTime() - ref.getTime()) / 60000);
  if (mins < 0) return label;
  const h = Math.floor(mins / 60), m = mins % 60;
  const type = next.type === "H" ? "High" : "Low";
  return `${label} — ${type} in ${h > 0 ? `${h}h ${m}m` : `${m}m`}`;
}
