"use client";

import type { ProfileStats, TrendPoint } from "@/lib/types";
import { formatKg, formatPercent, formatDate } from "@/utils/format";
import Sparkline from "./Sparkline";
import ProgressBar from "./ProgressBar";

interface FamilyLeaderboardProps {
  stats: ProfileStats[];
  trendPoints: Record<string, TrendPoint[]>;
  currentProfileId?: string;
}

function medal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function statusLabel(progress: number | null): { text: string; color: string } {
  if (progress == null) return { text: "No goal set", color: "text-gray-400" };
  if (progress >= 100) return { text: "Goal reached! 🏆", color: "text-amber-600" };
  if (progress >= 85) return { text: "So close! 🏃", color: "text-emerald-600" };
  if (progress >= 60) return { text: "Crushing it! ⚡", color: "text-emerald-600" };
  if (progress >= 35) return { text: "Making real progress 🔥", color: "text-blue-600" };
  if (progress >= 15) return { text: "Building momentum 🚶", color: "text-blue-500" };
  if (progress > 0) return { text: "Just getting started 💪", color: "text-gray-500" };
  return { text: "Just getting started 💪", color: "text-gray-500" };
}

function sortStats(stats: ProfileStats[]): ProfileStats[] {
  return [...stats].sort((a, b) => {
    const pa = a.progressTowardGoalPercent ?? -1;
    const pb = b.progressTowardGoalPercent ?? -1;
    return pb - pa;
  });
}

export default function FamilyLeaderboard({
  stats,
  trendPoints,
  currentProfileId,
}: FamilyLeaderboardProps) {
  if (stats.length === 0) return null;

  const ranked = sortStats(stats);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏆</span>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Family Leaderboard</h2>
          <p className="text-xs text-gray-400">Ranked by progress toward goal</p>
        </div>
      </div>

      {/* Ranked list */}
      {ranked.map((s, idx) => {
        const rank = idx + 1;
        const isMe = s.profileId === currentProfileId;
        const points = trendPoints[s.profileId] ?? [];
        const trendData = points.map((p) => p.trendWeight);
        const status = statusLabel(s.progressTowardGoalPercent);
        const isTop3 = rank <= 3;

        return (
          <div
            key={s.profileId}
            className={`rounded-2xl border p-4 transition-all ${
              isMe
                ? "border-emerald-400 bg-emerald-50 shadow-sm"
                : isTop3
                ? "border-amber-200 bg-amber-50"
                : "border-gray-100 bg-white"
            }`}
          >
            {/* Top row: rank + name + sparkline */}
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black w-10 text-center shrink-0 ${isTop3 ? "" : "text-gray-400"}`}>
                {medal(rank)}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-gray-800 text-base leading-tight">{s.name}</span>
                  {isMe && (
                    <span className="text-xs bg-emerald-200 text-emerald-800 rounded-full px-2 py-0.5 font-medium">
                      you
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
              </div>

              <Sparkline data={trendData} color={isMe ? "#10b981" : "#9ca3af"} />
            </div>

            {/* Progress bar */}
            {s.progressTowardGoalPercent != null && (
              <div className="mt-3">
                <ProgressBar value={s.progressTowardGoalPercent} />
              </div>
            )}

            {/* Stats row */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniStat
                label="Trend"
                value={formatKg(s.latestTrendWeight)}
                highlight={isMe}
              />
              <MiniStat
                label={s.isWeightLossGoal ? "Lost" : "Gained"}
                value={
                  s.kgChange == null
                    ? "—"
                    : `${Math.abs(s.kgChange).toFixed(1)} kg`
                }
                positive={s.kgChange != null && s.isWeightLossGoal ? s.kgChange > 0 : s.kgChange != null && !s.isWeightLossGoal ? s.kgChange < 0 : null}
              />
              <MiniStat label="Goal" value={formatKg(s.goalWeight)} />
            </div>

            {/* Last weigh-in */}
            <p className="text-xs text-gray-400 mt-2 text-right">
              Last weighed in: {formatDate(s.lastWeighInDate)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean | null;
}) {
  const valueColor =
    positive === true
      ? "text-emerald-600"
      : positive === false
      ? "text-red-400"
      : highlight
      ? "text-emerald-700"
      : "text-gray-700";

  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}
