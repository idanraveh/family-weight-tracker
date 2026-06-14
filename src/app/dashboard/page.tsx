"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, Users } from "lucide-react";
import type { Profile, WeighIn, ProfileStats, TrendPoint } from "@/lib/types";
import {
  calculateTrendWeights,
  getProfileStats,
  calculateStreak,
  getWeeklySummary,
} from "@/utils/calculations";
import { formatKg, formatPercent, todayISO } from "@/utils/format";
import WeighInForm from "@/components/WeighInForm";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import FamilyLeaderboard from "@/components/FamilyLeaderboard";
import RecentWeighIns from "@/components/RecentWeighIns";
import WeightChart from "@/components/WeightChart";
import StreakBadge from "@/components/StreakBadge";
import WeeklySummaryCard from "@/components/WeeklySummaryCard";

interface DashboardData {
  profile: Profile;
  weighIns: WeighIn[];
  allProfiles: Profile[];
  allWeighIns: Record<string, WeighIn[]>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const profileId = localStorage.getItem("profileId");
    const familyId = localStorage.getItem("familyId");
    if (!profileId || !familyId) { router.replace("/profiles"); return; }

    try {
      const [profileRes, weighInsRes, allProfilesRes, allWeighInsRes] = await Promise.all([
        fetch(`/api/profiles/${profileId}`),
        fetch(`/api/weigh-ins?profileId=${profileId}`),
        fetch(`/api/profiles?familyId=${familyId}`),
        fetch(`/api/weigh-ins?familyId=${familyId}`),
      ]);
      const [profileData, weighInsData, allProfilesData, allWeighInsData] = await Promise.all([
        profileRes.json(),
        weighInsRes.json(),
        allProfilesRes.json(),
        allWeighInsRes.json(),
      ]);

      setData({
        profile: profileData.profile,
        weighIns: weighInsData.weighIns ?? [],
        allProfiles: allProfilesData.profiles ?? [],
        allWeighIns: allWeighInsData.weighInsByProfile ?? {},
      });
    } catch {
      setError("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSaveWeighIn(weightKg: number, date: string) {
    const profileId = localStorage.getItem("profileId")!;
    const res = await fetch("/api/weigh-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, weightKg, date }),
    });
    if (!res.ok) throw new Error("Failed to save");
    await loadData();
  }

  async function handleDeleteWeighIn(id: string) {
    const res = await fetch(`/api/weigh-ins/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    await loadData();
  }

  async function handleEditWeighIn(id: string, weightKg: number, date: string) {
    const res = await fetch(`/api/weigh-ins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg, date }),
    });
    if (!res.ok) throw new Error("Failed to update");
    await loadData();
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || "Something went wrong."}</p>
        <button onClick={loadData} className="mt-4 text-emerald-600 underline">Retry</button>
      </div>
    );
  }

  const { profile, weighIns, allProfiles, allWeighIns } = data;
  const myStats = getProfileStats(profile, weighIns);
  const trendPoints = calculateTrendWeights(weighIns);
  const streak = calculateStreak(weighIns);
  const weekly = getWeeklySummary(weighIns);
  const todayEntry = weighIns.find((w) => w.date === todayISO());

  const familyStats: ProfileStats[] = allProfiles.map((p) =>
    getProfileStats(p, allWeighIns[p.id] ?? [])
  );
  const trendPointsByProfile: Record<string, TrendPoint[]> = {};
  for (const p of allProfiles) {
    trendPointsByProfile[p.id] = calculateTrendWeights(allWeighIns[p.id] ?? []);
  }

  const hasData = myStats.latestTrendWeight != null;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{typeof window !== "undefined" ? localStorage.getItem("familyName") : ""}</p>
          <h1 className="text-2xl font-bold text-gray-800">{profile.name}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/profiles")} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Switch profile">
            <Users size={20} />
          </button>
          <button onClick={() => router.push("/profile/edit")} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Edit profile">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Weigh-in form */}
      <WeighInForm onSave={handleSaveWeighIn} todayWeight={todayEntry?.weight_kg} />

      {/* Streak + weekly summary */}
      {hasData && (
        <>
          <StreakBadge streak={streak} />
          <WeeklySummaryCard summary={weekly} isWeightLossGoal={myStats.isWeightLossGoal} />
        </>
      )}

      {/* Personal stats */}
      {hasData && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-700">Your stats</h2>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Trend weight"
              value={formatKg(myStats.latestTrendWeight)}
              sub="Smoothed average"
              highlight
            />
            <StatCard label="Latest weigh-in" value={formatKg(myStats.latestRawWeight)} />
            <StatCard label="Starting weight" value={formatKg(myStats.firstWeight)} />
            <StatCard label="Goal" value={formatKg(myStats.goalWeight)} />
          </div>

          {myStats.kgChange != null && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {myStats.isWeightLossGoal ? "Body weight lost" : "Body weight gained"}
                </span>
                <span className="text-lg font-bold text-gray-800">
                  {formatPercent(myStats.bodyWeightChangePercent)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Kg change</span>
                <span className={`text-lg font-bold ${myStats.isWeightLossGoal && myStats.kgChange > 0 ? "text-emerald-600" : "text-gray-800"}`}>
                  {myStats.kgChange > 0
                    ? `−${myStats.kgChange.toFixed(1)} kg`
                    : myStats.kgChange < 0
                    ? `+${Math.abs(myStats.kgChange).toFixed(1)} kg`
                    : "No change"}
                </span>
              </div>
              {myStats.progressTowardGoalPercent != null && (
                <div className="mt-1">
                  <ProgressBar value={myStats.progressTowardGoalPercent} label="Progress to goal" />
                </div>
              )}
            </div>
          )}

          {/* Weight chart */}
          {trendPoints.length >= 2 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Weight over time</h3>
              <WeightChart points={trendPoints} />
            </div>
          )}

          {/* Full trend insights link */}
          <button
            onClick={() => router.push("/trend")}
            className="flex items-center justify-between bg-white border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl px-5 py-4 transition-colors group"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <span className="text-left">
                <span className="block font-bold text-gray-800">Weight Trend insights</span>
                <span className="block text-xs text-gray-400">
                  Changes, weekly pace, energy balance &amp; projection
                </span>
              </span>
            </span>
            <span className="text-gray-300 group-hover:text-emerald-500 text-xl">→</span>
          </button>
        </div>
      )}

      {/* Family leaderboard */}
      <FamilyLeaderboard
        stats={familyStats}
        trendPoints={trendPointsByProfile}
        currentProfileId={profile.id}
      />

      {/* Recent weigh-ins */}
      <RecentWeighIns
        weighIns={weighIns}
        onDelete={handleDeleteWeighIn}
        onEdit={handleEditWeighIn}
      />
    </div>
  );
}
