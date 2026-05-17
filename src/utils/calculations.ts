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
  thisWeekAvg: number | null;
  lastWeekAvg: number | null;
  delta: number | null; // negative = lost weight
}

export function getWeeklySummary(weighIns: WeighIn[]): WeeklySummary {
  const points = calculateTrendWeights(weighIns);
  if (points.length === 0) return { thisWeekAvg: null, lastWeekAvg: null, delta: null };

  const today = new Date().toISOString().slice(0, 10);
  const day7 = offsetDate(today, -7);
  const day14 = offsetDate(today, -14);

  const thisWeek = points.filter((p) => p.date > day7 && p.date <= today);
  const lastWeek = points.filter((p) => p.date > day14 && p.date <= day7);

  const avg = (pts: TrendPoint[]) =>
    pts.length === 0 ? null : +(pts.reduce((s, p) => s + p.trendWeight, 0) / pts.length).toFixed(2);

  const thisWeekAvg = avg(thisWeek);
  const lastWeekAvg = avg(lastWeek);
  const delta =
    thisWeekAvg != null && lastWeekAvg != null
      ? +(thisWeekAvg - lastWeekAvg).toFixed(2)
      : null;

  return { thisWeekAvg, lastWeekAvg, delta };
}
