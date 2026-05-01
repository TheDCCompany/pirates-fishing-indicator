// Solunar feeding window calculator
// Major periods: moon overhead (upper transit) and underfoot (lower transit) — 2 hr windows
// Minor periods: moonrise and moonset — 1 hr windows

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function mod360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function jdFromDate(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

function dateFromJD(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

// Moon's geocentric equatorial coordinates — simplified Meeus Ch 47 (~1° accuracy)
function moonEquatorial(jd: number): { ra: number; dec: number } {
  const d = jd - 2451545.0;
  const L  = mod360(218.316 + 13.176396 * d);
  const M  = mod360(134.963 + 13.064993 * d);
  const F  = mod360(93.272  + 13.229350 * d);
  const D  = mod360(297.850 + 12.190749 * d);
  const Ms = mod360(357.529 +  0.985600 * d);

  const lambda = mod360(L
    + 6.289 * Math.sin(M          * DEG)
    - 1.274 * Math.sin((2*D - M)  * DEG)
    + 0.658 * Math.sin(2*D        * DEG)
    - 0.186 * Math.sin(Ms         * DEG)
    - 0.114 * Math.sin(2*F        * DEG)
    + 0.059 * Math.sin((2*D-2*M)  * DEG)
    + 0.053 * Math.sin((2*D + M)  * DEG)
    + 0.046 * Math.sin((2*D - Ms) * DEG)
    + 0.041 * Math.sin((M  - Ms)  * DEG)
    - 0.035 * Math.sin(D          * DEG)
  );
  const beta =
    5.128 * Math.sin(F         * DEG) +
    0.280 * Math.sin((M + F)   * DEG) +
    0.277 * Math.sin((M - F)   * DEG) +
    0.173 * Math.sin((2*D - F) * DEG) +
    0.055 * Math.sin((2*D - M + F) * DEG) +
    0.046 * Math.sin((2*D - M - F) * DEG);

  const eps  = 23.4393 - 3.563e-7 * d;
  const lRad = lambda * DEG, bRad = beta * DEG, eRad = eps * DEG;

  const ra = mod360(Math.atan2(
    Math.sin(lRad) * Math.cos(eRad) - Math.tan(bRad) * Math.sin(eRad),
    Math.cos(lRad)
  ) * RAD);
  const dec = Math.asin(
    Math.sin(bRad) * Math.cos(eRad) +
    Math.cos(bRad) * Math.sin(eRad) * Math.sin(lRad)
  ) * RAD;

  return { ra, dec };
}

// Greenwich Mean Sidereal Time (degrees)
function gmst(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  return mod360(
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T
  );
}

// LHA rate: GMST ~360.985°/day minus moon RA ~13.176°/day
const LHA_RATE = 347.809; // degrees per day

// Find Julian day of the moon transit nearest jd0
// lower=false → upper transit (overhead), lower=true → lower transit (underfoot)
function findTransit(jd0: number, lon: number, lower: boolean): number {
  let jd = jd0;
  for (let i = 0; i < 12; i++) {
    const { ra } = moonEquatorial(jd);
    let lha = mod360(gmst(jd) + lon - ra);
    if (lower) lha = mod360(lha - 180);
    if (lha > 180) lha -= 360; // signed: positive = just passed transit
    jd -= lha / LHA_RATE;
  }
  return jd;
}

// Moon altitude in degrees at given JD and location
function moonAlt(jd: number, lat: number, lon: number): number {
  const { ra, dec } = moonEquatorial(jd);
  const lha = mod360(gmst(jd) + lon - ra) * DEG;
  return Math.asin(
    Math.sin(lat * DEG) * Math.sin(dec * DEG) +
    Math.cos(lat * DEG) * Math.cos(dec * DEG) * Math.cos(lha)
  ) * RAD;
}

// Scan for moonrise or moonset within [startJD, endJD]
function scanMoonEvent(
  startJD: number, endJD: number, lat: number, lon: number, event: "rise" | "set"
): Date | null {
  const STEP = 5 / 1440; // 5 minutes
  let prev = moonAlt(startJD, lat, lon);
  let prevJD = startJD;
  for (let jd = startJD + STEP; jd <= endJD + STEP; jd += STEP) {
    const alt = moonAlt(jd, lat, lon);
    if (event === "rise" && prev < 0 && alt >= 0) {
      const frac = -prev / (alt - prev);
      return dateFromJD(prevJD + frac * (jd - prevJD));
    }
    if (event === "set" && prev >= 0 && alt < 0) {
      const frac = prev / (prev - alt);
      return dateFromJD(prevJD + frac * (jd - prevJD));
    }
    prev = alt;
    prevJD = jd;
  }
  return null;
}

// Returns local-day bounds for America/Chicago (auto CDT/CST)
function centralDayBounds(now: Date): { start: Date; end: Date } {
  const localStr = now.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  // Probe UTC hours 4–7 to find midnight transition in Central time
  for (let h = 4; h <= 7; h++) {
    const candidate = new Date(`${localStr}T${String(h).padStart(2,"0")}:00:00Z`);
    const after  = candidate.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
    const before = new Date(candidate.getTime() - 60000)
      .toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
    if (after === localStr && before !== localStr) {
      return { start: candidate, end: new Date(candidate.getTime() + 86400000) };
    }
  }
  // Fallback: CST (UTC-6)
  const start = new Date(`${localStr}T06:00:00Z`);
  return { start, end: new Date(start.getTime() + 86400000) };
}

export type SolunarPeriod = {
  type: "major" | "minor";
  label: string;  // "Moon Overhead" | "Moon Underfoot" | "Moonrise" | "Moonset"
  start: string;  // ISO
  peak: string;   // ISO
  end: string;    // ISO
  durationMinutes: number;
};

export type SolunarData = {
  periods: SolunarPeriod[];
};

export function computeSolunar(now: Date, lat: number, lon: number): SolunarData {
  const { start: dayStart, end: dayEnd } = centralDayBounds(now);
  const dayStartJD = jdFromDate(dayStart);
  const dayEndJD   = jdFromDate(dayEnd);

  // Local noon — good starting point for transit searches
  const noonJD = jdFromDate(new Date(dayStart.getTime() + 12 * 3600000));

  const periods: SolunarPeriod[] = [];
  const seenMin = new Set<number>();

  function addPeriod(
    peak: Date,
    type: "major" | "minor",
    label: string,
    halfMinutes: number
  ) {
    if (peak < dayStart || peak > dayEnd) return;
    const key = Math.round(peak.getTime() / 60000);
    if (seenMin.has(key)) return;
    seenMin.add(key);
    periods.push({
      type,
      label,
      start: new Date(peak.getTime() - halfMinutes * 60000).toISOString(),
      peak: peak.toISOString(),
      end:  new Date(peak.getTime() + halfMinutes * 60000).toISOString(),
      durationMinutes: halfMinutes * 2,
    });
  }

  // --- Major periods: search around noon ±half lunar day to catch both ---
  const HALF_LUNAR_DAY = 0.515; // days (~12h 22min)
  for (const lower of [false, true]) {
    for (const offset of [-HALF_LUNAR_DAY, 0, HALF_LUNAR_DAY]) {
      const jdT = findTransit(noonJD + offset, lon, lower);
      addPeriod(
        dateFromJD(jdT),
        "major",
        lower ? "Moon Underfoot" : "Moon Overhead",
        60
      );
    }
  }

  // --- Minor periods: moonrise and moonset ---
  const rise = scanMoonEvent(dayStartJD, dayEndJD, lat, lon, "rise");
  const set  = scanMoonEvent(dayStartJD, dayEndJD, lat, lon, "set");
  if (rise) addPeriod(rise, "minor", "Moonrise", 30);
  if (set)  addPeriod(set,  "minor", "Moonset",  30);

  periods.sort((a, b) => new Date(a.peak).getTime() - new Date(b.peak).getTime());

  return { periods };
}
