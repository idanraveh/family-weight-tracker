"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Profile, WeighIn } from "@/lib/types";
import {
  calculateTrendWeights,
  getProfileStats,
  getWeightChangeWindows,
  getTrendInsights,
} from "@/utils/calculations";
import WeightChart from "@/components/WeightChart";
import WeightChangesTable from "@/components/WeightChangesTable";
import InsightCard from "@/components/InsightCard";

export default function TrendPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const profileId = localStorage.getItem("profileId");
    if (!profileId) { router.replace("/profiles"); return; }
    try {
      const [pRes, wRes] = await Promise.all([
        fetch(`/api/profiles/${profileId}`),
        fetch(`/api/weigh-ins?profileId=${profileId}`),
      ]);
      const [pData, wData] = await Promise.all([pRes.json(), wRes.json()]);
      setProfile(pData.profile);
      setWeighIns(wData.weighIns ?? []);
    } catch {
      setError("Failed to load. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || "Something went wrong."}</p>
        <button onClick={load} className="mt-4 text-emerald-600 underline">Retry</button>
      </div>
    );
  }

  const points = calculateTrendWeights(weighIns);
  const stats = getProfileStats(profile, weighIns);
  const windows = getWeightChangeWindows(weighIns);
  const insights = getTrendInsights(weighIns);

  const hasData = insights.currentWeight != null;
  const losing = insights.weeklyRate != null && insights.weeklyRate < 0;
  const goodRate =
    insights.weeklyRate != null &&
    ((stats.isWeightLossGoal && insights.weeklyRate < 0) ||
      (!stats.isWeightLossGoal && insights.weeklyRate > 0));

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="p-1 text-gray-500" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-2xl font-black text-gray-800">Weight Trend</h1>
      </div>

      {!hasData ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📈</p>
          <p className="font-bold text-gray-600">Not enough data yet</p>
          <p className="text-sm mt-1">Log a few weigh-ins to unlock your trend insights.</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          {points.length >= 2 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <WeightChart points={points} />
            </div>
          )}

          {/* Weight changes table */}
          <WeightChangesTable windows={windows} isWeightLossGoal={stats.isWeightLossGoal} />

          {/* Insight cards */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-6">
            <InsightCard
              value={insights.currentWeight!.toFixed(1)}
              unit="kg"
              title="Current Weight"
              description="Our estimate of your true weight after smoothing out day-to-day fluctuations."
            />

            {insights.weeklyRate != null && (
              <InsightCard
                value={`${insights.weeklyRate > 0 ? "+" : ""}${insights.weeklyRate.toFixed(2)}`}
                unit="kg per week"
                title="Weekly Weight Change"
                description="Your typical weekly rate of change over the past few weeks, from a line fitted through your trend."
                accent={goodRate ? "good" : insights.weeklyRate === 0 ? "neutral" : "bad"}
              />
            )}

            {insights.energyDeficitKcal != null && (
              <InsightCard
                value={`${insights.energyDeficitKcal > 0 ? "+" : ""}${insights.energyDeficitKcal}`}
                unit="kcal per day"
                title="Energy Balance"
                description={
                  insights.energyDeficitKcal < 0
                    ? "Estimated average daily calorie deficit, inferred from your rate of weight loss."
                    : insights.energyDeficitKcal > 0
                    ? "Estimated average daily calorie surplus, inferred from your rate of weight gain."
                    : "Your weight is holding steady — roughly matching energy in and out."
                }
                accent={losing ? "good" : "neutral"}
              />
            )}

            {insights.projection30Day != null && (
              <InsightCard
                value={insights.projection30Day.toFixed(1)}
                unit="kg"
                title="30-Day Projection"
                description="Your projected trend weight in 30 days if your current pace continues. Changes in habits can shift this."
              />
            )}
          </div>

          <p className="text-xs text-gray-300 text-center px-4">
            These are estimates based on your weigh-in history, not medical advice.
            Energy figures assume ~7,700 kcal per kg of body weight.
          </p>
        </>
      )}
    </div>
  );
}
