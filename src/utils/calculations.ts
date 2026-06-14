import type { WeighIn, Profile, ProfileStats, TrendPoint } from "@/lib/types";

const ALPHA = 0.25;

/** One weigh-in per day — keep the latest if there are duplicates. */
function dedupeByDay(weighIns: WeighIn[]): WeighIn[] {
  const map = new Map<string, WeighIn>();
  for (const w of weighIns) {
    const existing = map.get(w.date);
    if (!existing || w.created_at > existing.created_at) {
      map.set(w.date, w);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateTrendWeights(weighIns: WeighIn[]): TrendPoint[] {
  const sorted = dedupeByDay(weighIns);
  const points: TrendPoint[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const raw = sorted[i].weight_kg;
    const trend =
      i === 0 ? raw : ALPHA * raw + (1 - ALPHA) * points[i - 1].trendWeight;
    points.push({ date: sorted[i].date, rawWeight: raw, trendWeight: +trend.toFixed(2) });
  }

  return points;
}

export function getProfileStats(
  profile: Profile,
  weighIns: WeighIn[]
): ProfileStats {
  const points = calculateTrendWeights(weighIns);

  if (points.length === 0) {
    return {
      profileId: profile.id,
      name: profile.name,
      firstWeight: profile.starting_weight_kg,
      latestRawWeight: null,
      latestTrendWeight: null,
      goalWeight: profile.goal_weight_kg,
      kgChange: null,
      isWeightLossGoal: (profile.goal_weight_kg ?? 0) < (profile.starting_weight_kg ?? 0),
      bodyWeightChangePercent: null,
      progressTowardGoalPercent: null,
      lastWeighInDate: null,
      weighInCount: 0,
    };
  }

  const first = points[0];
  const last = points[points.length - 1];

  const firstWeight = profile.starting_weight_kg ?? first.rawWeight;
  const latestRawWeight = last.rawWeight;
  const latestTrendWeight = last.trendWeight;
  const goalWeight = profile.goal_weight_kg;
  const lastWeighInDate = last.date;
  const weighInCount = points.length;

  const isWeightLossGoal = goalWeight !== null && goalWeight < firstWeight;

  const kgChange = +(firstWeight - latestTrendWeight).toFixed(2);

  let bodyWeightChangePercent: number | null = null;
  let progressTowardGoalPercent: number | null = null;

  if (isWeightLossGoal) {
    bodyWeightChangePercent = calculateProgress(firstWeight, latestTrendWeight);
    if (goalWeight !== null) {
      const raw = ((firstWeight - latestTrendWeight) / (firstWeight - goalWeight)) * 100;
      progressTowardGoalPercent = clamp(+raw.toFixed(1), 0, 100);
    }
  } else {
    bodyWeightChangePercent = calculateProgress(latestTrendWeight, firstWeight);
    if (goalWeight !== null && goalWeight > firstWeight) {
      const raw = ((latestTrendWeight - firstWeight) / (goalWeight - firstWeight)) * 100;
      progressTowardGoalPercent = clamp(+raw.toFixed(1), 0, 100);
    }
  }

  return {
    profileId: profile.id,
    name: profile.name,
    firstWeight,
    latestRawWeight,
    latestTrendWeight,
    goalWeight,
    kgChange,
    isWeightLossGoal,
    bodyWeightChangePercent,
    progressTowardGoalPercent,
    lastWeighInDate,
    weighInCount,
  };
}

function calculateProgress(from: number, to: number): number {
  if (from === 0) return 0;
  return +Math.abs(((from - to) / from) * 100).toFixed(1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function offsetDate(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function calculateStreak(weighIns: WeighIn[]): number {
  if (weighIns.length === 0) return 0;

  const deduped = dedupeByDay(weighIns);
  const dates = new Set(deduped.map((w) => w.date));

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = offsetDate(todayStr, -1);

  // Streak must include today or yesterday to be active
  const start = dates.has(todayStr) ? todayStr : dates.has(yesterdayStr) ? yesterdayStr : null;
  if (!start) return 0;

  let streak = 0;
  let cursor = start;
  while (dates.has(cursor)) {
    streak++;
    cursor = offsetDate(cursor, -1);
  }
  return streak;
}

export interface WeeklySummary {
  // Weekly rate of change from a least-squares fit over the recent window.
  weeklyRate: number | null; // kg per week; negative = losing, positive = gaining
  now: number | null;        // latest trend weight (for display context)
  pointCount: number;        // number of trend points used in the fit
  daysSpan: number;          // calendar days the fit spans
}

const REGRESSION_WINDOW_DAYS = 28;

function daysBetween(a: string, b: string): number {
  const ms = new Date(b + "T12:00:00Z").getTime() - new Date(a + "T12:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Weekly rate via least-squares linear regression over the trend weights of the
 * last REGRESSION_WINDOW_DAYS. The slope (kg/day) × 7 is the weekly rate. Using
 * the full window instead of two single points means no single day's reading can
 * swing the result.
 */
export function getWeeklySummary(weighIns: WeighIn[]): WeeklySummary {
  const all = calculateTrendWeights(weighIns);
  if (all.length === 0) return { weeklyRate: null, now: null, pointCount: 0, daysSpan: 0 };

  const now = all[all.length - 1].trendWeight;
  const today = new Date().toISOString().slice(0, 10);
  const windowStart = offsetDate(today, -REGRESSION_WINDOW_DAYS);
  const points = all.filter((p) => p.date >= windowStart);

  // Need at least two points spanning real time to fit a slope.
  if (points.length < 2) {
    return { weeklyRate: null, now, pointCount: points.length, daysSpan: 0 };
  }

  const x0 = points[0].date;
  const xs = points.map((p) => daysBetween(x0, p.date)); // days since window's first point
  const ys = points.map((p) => p.trendWeight);
  const daysSpan = xs[xs.length - 1];

  const n = points.length;
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }

  // All weigh-ins on the same day → no slope.
  if (den === 0) {
    return { weeklyRate: null, now, pointCount: n, daysSpan };
  }

  const slopePerDay = num / den;
  const weeklyRate = +(slopePerDay * 7).toFixed(2);

  return { weeklyRate, now, pointCount: n, daysSpan };
}

// ─── Trend insights (MacroFactor-style) ──────────────────────────────────────

export type ChangeDirection = "up" | "down" | "flat";

export interface WeightChangeWindow {
  days: number;                 // window length: 3, 7, 14, 30, 90
  change: number | null;        // kg change over the window (now − start)
  direction: ChangeDirection;
  sparkline: number[];          // trend weights within the window
  hasFullWindow: boolean;       // true if data covers the whole window
}

const CHANGE_WINDOWS = [3, 7, 14, 30, 90];

function directionOf(change: number | null): ChangeDirection {
  if (change == null || Math.abs(change) < 0.05) return "flat";
  return change > 0 ? "up" : "down";
}

export function getWeightChangeWindows(weighIns: WeighIn[]): WeightChangeWindow[] {
  const points = calculateTrendWeights(weighIns);
  if (points.length === 0) {
    return CHANGE_WINDOWS.map((days) => ({
      days,
      change: null,
      direction: "flat" as ChangeDirection,
      sparkline: [],
      hasFullWindow: false,
    }));
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = points[points.length - 1].trendWeight;

  return CHANGE_WINDOWS.map((days) => {
    const cutoff = offsetDate(today, -days);
    const inWindow = points.filter((p) => p.date >= cutoff);

    // Anchor = last trend point on/before the cutoff (true N-day-ago value).
    const beforeCutoff = points.filter((p) => p.date < cutoff);
    const hasFullWindow = beforeCutoff.length > 0;
    const anchor = hasFullWindow
      ? beforeCutoff[beforeCutoff.length - 1].trendWeight
      : inWindow.length > 0
      ? inWindow[0].trendWeight
      : now;

    const change = +(now - anchor).toFixed(2);
    const sparkline = (hasFullWindow
      ? [anchor, ...inWindow.map((p) => p.trendWeight)]
      : inWindow.map((p) => p.trendWeight));

    return {
      days,
      change: inWindow.length === 0 && !hasFullWindow ? null : change,
      direction: directionOf(change),
      sparkline,
      hasFullWindow,
    };
  });
}

const KCAL_PER_KG = 7700; // approx energy in 1 kg of body mass

export interface TrendInsights {
  currentWeight: number | null;   // smoothed trend weight
  weeklyRate: number | null;      // kg per week (− = losing)
  energyDeficitKcal: number | null; // kcal/day (− = deficit)
  projection30Day: number | null; // projected trend weight in 30 days
  pointCount: number;
  daysSpan: number;
}

export function getTrendInsights(weighIns: WeighIn[]): TrendInsights {
  const { weeklyRate, now, pointCount, daysSpan } = getWeeklySummary(weighIns);

  const energyDeficitKcal =
    weeklyRate == null ? null : Math.round((weeklyRate * KCAL_PER_KG) / 7);

  const projection30Day =
    weeklyRate == null || now == null ? now : +(now + weeklyRate * (30 / 7)).toFixed(1);

  return {
    currentWeight: now,
    weeklyRate,
    energyDeficitKcal,
    projection30Day,
    pointCount,
    daysSpan,
  };
}
