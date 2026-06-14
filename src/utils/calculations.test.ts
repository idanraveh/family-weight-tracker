import { describe, it, expect } from "vitest";
import {
  calculateTrendWeights,
  getProfileStats,
  getWeeklySummary,
  getWeightChangeWindows,
  getTrendInsights,
} from "./calculations";
import type { WeighIn, Profile } from "@/lib/types";

/** ISO date `days` ago from today (UTC). */
function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function makeWeighIn(date: string, weight_kg: number, created_at?: string): WeighIn {
  return {
    id: date,
    profile_id: "p1",
    weight_kg,
    date,
    created_at: created_at ?? `${date}T08:00:00Z`,
  };
}

const baseProfile: Profile = {
  id: "p1",
  family_id: "f1",
  name: "Test",
  starting_weight_kg: 90,
  goal_weight_kg: 80,
  created_at: "2024-01-01T00:00:00Z",
};

describe("calculateTrendWeights", () => {
  it("returns empty array for no weigh-ins", () => {
    expect(calculateTrendWeights([])).toEqual([]);
  });

  it("first trend equals first raw weight", () => {
    const [p] = calculateTrendWeights([makeWeighIn("2024-01-01", 90)]);
    expect(p.trendWeight).toBe(90);
    expect(p.rawWeight).toBe(90);
  });

  it("applies EMA with alpha 0.25", () => {
    const weighIns = [
      makeWeighIn("2024-01-01", 90),
      makeWeighIn("2024-01-02", 88),
    ];
    const [, p2] = calculateTrendWeights(weighIns);
    const expected = +(0.25 * 88 + 0.75 * 90).toFixed(2);
    expect(p2.trendWeight).toBe(expected); // 89.5
  });

  it("de-dupes same-day entries, keeps latest created_at", () => {
    const weighIns = [
      makeWeighIn("2024-01-01", 90, "2024-01-01T08:00:00Z"),
      makeWeighIn("2024-01-01", 85, "2024-01-01T20:00:00Z"),
    ];
    const points = calculateTrendWeights(weighIns);
    expect(points).toHaveLength(1);
    expect(points[0].rawWeight).toBe(85);
  });

  it("handles multiple days in sequence", () => {
    const weighIns = [
      makeWeighIn("2024-01-01", 100),
      makeWeighIn("2024-01-02", 98),
      makeWeighIn("2024-01-03", 99),
    ];
    const [p1, p2, p3] = calculateTrendWeights(weighIns);
    expect(p1.trendWeight).toBe(100);
    expect(p2.trendWeight).toBe(+(0.25 * 98 + 0.75 * 100).toFixed(2));
    expect(p3.trendWeight).toBe(+(0.25 * 99 + 0.75 * p2.trendWeight).toFixed(2));
  });
});

describe("getProfileStats — weight loss goal", () => {
  const weighIns = [
    makeWeighIn("2024-01-01", 90),
    makeWeighIn("2024-01-02", 89),
    makeWeighIn("2024-01-03", 88),
  ];

  it("returns correct firstWeight from profile", () => {
    const stats = getProfileStats(baseProfile, weighIns);
    expect(stats.firstWeight).toBe(90);
  });

  it("latestRawWeight equals last weigh-in", () => {
    const stats = getProfileStats(baseProfile, weighIns);
    expect(stats.latestRawWeight).toBe(88);
  });

  it("isWeightLossGoal is true when goal < start", () => {
    const stats = getProfileStats(baseProfile, weighIns);
    expect(stats.isWeightLossGoal).toBe(true);
  });

  it("kgChange is positive for weight lost", () => {
    const stats = getProfileStats(baseProfile, weighIns);
    expect(stats.kgChange).toBeGreaterThan(0);
  });

  it("progressTowardGoalPercent is clamped 0-100", () => {
    const stats = getProfileStats(baseProfile, weighIns);
    expect(stats.progressTowardGoalPercent).toBeGreaterThanOrEqual(0);
    expect(stats.progressTowardGoalPercent).toBeLessThanOrEqual(100);
  });
});

describe("getProfileStats — weight gain goal", () => {
  const gainProfile: Profile = {
    ...baseProfile,
    starting_weight_kg: 60,
    goal_weight_kg: 70,
  };
  const weighIns = [
    makeWeighIn("2024-01-01", 60),
    makeWeighIn("2024-01-05", 62),
  ];

  it("isWeightLossGoal is false for weight gain", () => {
    const stats = getProfileStats(gainProfile, weighIns);
    expect(stats.isWeightLossGoal).toBe(false);
  });

  it("kgChange is negative for weight gained", () => {
    const stats = getProfileStats(gainProfile, weighIns);
    expect(stats.kgChange).toBeLessThan(0);
  });
});

describe("getProfileStats — no weigh-ins", () => {
  it("returns null for all weight stats", () => {
    const stats = getProfileStats(baseProfile, []);
    expect(stats.latestRawWeight).toBeNull();
    expect(stats.latestTrendWeight).toBeNull();
    expect(stats.kgChange).toBeNull();
  });
});

describe("getWeeklySummary — regression-based weekly pace", () => {
  it("returns null rate with no weigh-ins", () => {
    const s = getWeeklySummary([]);
    expect(s.weeklyRate).toBeNull();
    expect(s.now).toBeNull();
  });

  it("returns null rate with a single weigh-in", () => {
    const s = getWeeklySummary([makeWeighIn(daysAgo(2), 80)]);
    expect(s.weeklyRate).toBeNull();
    expect(s.now).toBe(80);
  });

  it("recovers a steady loss rate of ~0.5 kg/week", () => {
    // Raw weight falls 0.5 kg/week = 1/14 kg per day over 21 days.
    // Trend (EMA) converges to the same slope; allow tolerance for EMA lag.
    const perDay = 0.5 / 7;
    const weighIns = [];
    for (let d = 21; d >= 0; d--) {
      weighIns.push(makeWeighIn(daysAgo(d), +(85 - (21 - d) * perDay).toFixed(2)));
    }
    const s = getWeeklySummary(weighIns);
    expect(s.weeklyRate).not.toBeNull();
    expect(s.weeklyRate!).toBeGreaterThan(-0.6);
    expect(s.weeklyRate!).toBeLessThan(-0.4);
    expect(s.pointCount).toBeGreaterThan(2);
  });

  it("reports a positive rate for steady gain", () => {
    const weighIns = [];
    for (let d = 21; d >= 0; d--) {
      weighIns.push(makeWeighIn(daysAgo(d), +(60 + (21 - d) * 0.1).toFixed(2)));
    }
    const s = getWeeklySummary(weighIns);
    expect(s.weeklyRate!).toBeGreaterThan(0);
  });

  it("reports ~zero rate for flat weight", () => {
    const weighIns = [];
    for (let d = 14; d >= 0; d--) {
      weighIns.push(makeWeighIn(daysAgo(d), 75));
    }
    const s = getWeeklySummary(weighIns);
    expect(Math.abs(s.weeklyRate!)).toBeLessThan(0.05);
  });
});

describe("getWeightChangeWindows", () => {
  it("returns all five windows even with no data", () => {
    const windows = getWeightChangeWindows([]);
    expect(windows.map((w) => w.days)).toEqual([3, 7, 14, 30, 90]);
    expect(windows.every((w) => w.change === null)).toBe(true);
  });

  it("computes a negative change for a falling trend", () => {
    const weighIns = [];
    for (let d = 30; d >= 0; d--) {
      weighIns.push(makeWeighIn(daysAgo(d), +(90 - (30 - d) * 0.1).toFixed(2)));
    }
    const windows = getWeightChangeWindows(weighIns);
    const w7 = windows.find((w) => w.days === 7)!;
    expect(w7.change).not.toBeNull();
    expect(w7.change!).toBeLessThan(0);
    expect(w7.direction).toBe("down");
    expect(w7.hasFullWindow).toBe(true);
  });

  it("marks short history as not having a full long window", () => {
    const weighIns = [makeWeighIn(daysAgo(2), 80), makeWeighIn(daysAgo(1), 79.8)];
    const windows = getWeightChangeWindows(weighIns);
    const w90 = windows.find((w) => w.days === 90)!;
    expect(w90.hasFullWindow).toBe(false);
  });
});

describe("getTrendInsights", () => {
  it("derives energy deficit and projection from the weekly rate", () => {
    // Steady ~ -0.7 kg/week loss over 28 days
    const perDay = 0.1;
    const weighIns = [];
    for (let d = 28; d >= 0; d--) {
      weighIns.push(makeWeighIn(daysAgo(d), +(90 - (28 - d) * perDay).toFixed(2)));
    }
    const ins = getTrendInsights(weighIns);
    expect(ins.currentWeight).not.toBeNull();
    expect(ins.weeklyRate!).toBeLessThan(0);

    // energy deficit = weeklyRate * 7700 / 7, should be negative (a deficit)
    expect(ins.energyDeficitKcal!).toBeLessThan(0);
    const expectedKcal = Math.round((ins.weeklyRate! * 7700) / 7);
    expect(ins.energyDeficitKcal).toBe(expectedKcal);

    // projection = now + weeklyRate * 30/7, should be below current weight
    expect(ins.projection30Day!).toBeLessThan(ins.currentWeight!);
  });

  it("returns nulls with no data", () => {
    const ins = getTrendInsights([]);
    expect(ins.currentWeight).toBeNull();
    expect(ins.energyDeficitKcal).toBeNull();
  });
});
