"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserPlus } from "lucide-react";
import type { Profile, WeighIn, ProfileStats } from "@/lib/types";
import { getProfileStats, calculateStreak } from "@/utils/calculations";
import { formatKg } from "@/utils/format";
import ProgressBar from "@/components/ProgressBar";

// ─── helpers ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6",
  "#f59e0b", "#ec4899", "#06b6d4",
];
function avatarColor(name: string): string {
  const sum = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function rankProfiles(stats: ProfileStats[]): ProfileStats[] {
  return [...stats].sort((a, b) => {
    const pa = a.progressTowardGoalPercent ?? (a.latestTrendWeight != null ? -0.5 : -1);
    const pb = b.progressTowardGoalPercent ?? (b.latestTrendWeight != null ? -0.5 : -1);
    return pb - pa;
  });
}

function medal(rank: number) {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
}

function statusLabel(progress: number | null): string {
  if (progress == null) return "No goal set";
  if (progress >= 100) return "Goal reached! 🏆";
  if (progress >= 85) return "So close! 🏃";
  if (progress >= 60) return "Crushing it! ⚡";
  if (progress >= 35) return "On fire! 🔥";
  if (progress >= 15) return "Building momentum 💪";
  return "Just getting started";
}

// ─── sub-components ─────────────────────────────────────────────────────────

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(name),
        fontSize: size * 0.4,
      }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

function StatChip({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center gap-0.5">
      <span className="text-xl">{icon}</span>
      <span className="font-black text-gray-800 text-base leading-tight">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function HighlightCard({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-2xl shrink-0">{emoji}</span>
      <p className="text-sm font-medium text-gray-700">{text}</p>
    </div>
  );
}

// Podium — reorders [#2, #1, #3] for the classic podium look
function Podium({
  ranked,
  onSelect,
}: {
  ranked: ProfileStats[];
  onSelect: (id: string) => void;
}) {
  // Display order: 2nd left, 1st center, 3rd right
  const slots =
    ranked.length === 1
      ? [ranked[0]]
      : ranked.length === 2
      ? [ranked[1], ranked[0]]
      : [ranked[1], ranked[0], ranked[2]];

  // Platform heights in display order
  const heights = ranked.length === 1 ? [88] : ranked.length === 2 ? [56, 88] : [56, 88, 40];

  // Platform colors
  const platformColor = (rank: number) =>
    rank === 1
      ? "bg-amber-400"
      : rank === 2
      ? "bg-slate-300"
      : "bg-amber-700/70";

  const platformText = (rank: number) =>
    rank === 1 ? "text-amber-800" : rank === 2 ? "text-slate-500" : "text-amber-900";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end justify-center gap-2">
        {slots.map((s, i) => {
          const rank = ranked.indexOf(s) + 1;
          const h = heights[i];
          return (
            <button
              key={s.profileId}
              onClick={() => onSelect(s.profileId)}
              className="flex flex-col items-center flex-1 group"
            >
              {/* Card above platform */}
              <div className="flex flex-col items-center gap-0.5 pb-2 px-1 w-full group-active:scale-95 transition-transform">
                <Avatar name={s.name} size={44} />
                <span className="text-xl leading-none mt-0.5">{medal(rank)}</span>
                <p className="font-black text-gray-800 text-sm text-center leading-tight">{s.name}</p>
                <p className="text-xs text-gray-500 font-medium">{formatKg(s.latestTrendWeight)}</p>

                {s.kgChange != null && (
                  <p
                    className={`text-xs font-bold ${
                      s.isWeightLossGoal && s.kgChange > 0
                        ? "text-emerald-600"
                        : s.kgChange !== 0
                        ? "text-gray-400"
                        : "text-gray-400"
                    }`}
                  >
                    {s.kgChange > 0
                      ? `↓ ${s.kgChange.toFixed(1)} kg`
                      : s.kgChange < 0
                      ? `↑ ${Math.abs(s.kgChange).toFixed(1)} kg`
                      : "—"}
                  </p>
                )}

                {s.progressTowardGoalPercent != null && (
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full mt-0.5 ${
                      rank === 1
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.progressTowardGoalPercent.toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Platform */}
              <div
                className={`w-full rounded-t-xl flex items-start justify-center pt-2 ${platformColor(rank)}`}
                style={{ height: h }}
              >
                <span className={`text-2xl font-black opacity-25 ${platformText(rank)}`}>{rank}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tap hint */}
      <p className="text-center text-xs text-gray-400 mt-1">Tap your name to enter →</p>
    </div>
  );
}

function RankedRow({
  stats,
  rank,
  onSelect,
}: {
  stats: ProfileStats;
  rank: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3 bg-white border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl px-4 py-3 text-left w-full transition-colors group"
    >
      <span className="text-gray-400 font-black text-sm w-5 text-center shrink-0">#{rank}</span>
      <Avatar name={stats.name} size={38} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm">{stats.name}</p>
        <p className="text-xs text-gray-400">{statusLabel(stats.progressTowardGoalPercent)}</p>
        {stats.progressTowardGoalPercent != null && (
          <div className="mt-1">
            <ProgressBar value={stats.progressTowardGoalPercent} />
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-gray-700 text-sm">{formatKg(stats.latestTrendWeight)}</p>
        {stats.kgChange != null && (
          <p className={`text-xs font-semibold ${stats.isWeightLossGoal && stats.kgChange > 0 ? "text-emerald-600" : "text-gray-400"}`}>
            {stats.kgChange > 0 ? `↓${stats.kgChange.toFixed(1)}` : stats.kgChange < 0 ? `↑${Math.abs(stats.kgChange).toFixed(1)}` : "—"} kg
          </p>
        )}
      </div>
      <span className="text-gray-300 group-hover:text-emerald-500 text-sm ml-1">→</span>
    </button>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [weighInsByProfile, setWeighInsByProfile] = useState<Record<string, WeighIn[]>>({});
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (familyId: string) => {
    try {
      const [pRes, wRes] = await Promise.all([
        fetch(`/api/profiles?familyId=${familyId}`),
        fetch(`/api/weigh-ins?familyId=${familyId}`),
      ]);
      const [pData, wData] = await Promise.all([pRes.json(), wRes.json()]);
      setProfiles(pData.profiles ?? []);
      setWeighInsByProfile(wData.weighInsByProfile ?? {});
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const familyId = localStorage.getItem("familyId");
    const name = localStorage.getItem("familyName");
    if (!familyId) { router.replace("/"); return; }
    setFamilyName(name ?? "Your Family");
    load(familyId);
  }, [router, load]);

  function selectProfile(profileId: string) {
    const p = profiles.find((p) => p.id === profileId);
    if (!p) return;
    localStorage.setItem("profileId", p.id);
    localStorage.setItem("profileName", p.name);
    router.push("/dashboard");
  }

  function logout() {
    ["familyId", "familyName", "profileId", "profileName"].forEach((k) =>
      localStorage.removeItem(k)
    );
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 mt-6">
        <div className="h-10 w-48 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const allStats = profiles.map((p) => getProfileStats(p, weighInsByProfile[p.id] ?? []));
  const ranked = rankProfiles(allStats);
  const podium = ranked.slice(0, Math.min(3, ranked.length));
  const rest = ranked.slice(podium.length);

  // Family highlights
  const totalWeighIns = Object.values(weighInsByProfile).reduce((s, w) => s + w.length, 0);
  const totalKgLost = allStats.reduce((s, st) => {
    if (st.kgChange && st.kgChange > 0 && st.isWeightLossGoal) return +(s + st.kgChange).toFixed(1);
    return s;
  }, 0);

  const streaks = allStats
    .map((s) => ({ name: s.name, streak: calculateStreak(weighInsByProfile[s.profileId] ?? []) }))
    .sort((a, b) => b.streak - a.streak);

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const thisWeekLogs = allStats
    .map((s) => ({
      name: s.name,
      count: (weighInsByProfile[s.profileId] ?? []).filter((w) => w.date > weekAgo).length,
    }))
    .sort((a, b) => b.count - a.count);

  const highlights: { emoji: string; text: string }[] = [];
  if (streaks[0]?.streak >= 2)
    highlights.push({ emoji: "🔥", text: `${streaks[0].name} is on a ${streaks[0].streak}-day streak` });
  if (thisWeekLogs[0]?.count >= 3)
    highlights.push({ emoji: "⭐", text: `${thisWeekLogs[0].name} logged ${thisWeekLogs[0].count}× this week` });
  if (totalKgLost >= 0.5)
    highlights.push({ emoji: "💪", text: `Together you've lost ${totalKgLost.toFixed(1)} kg` });
  if (ranked[0]?.progressTowardGoalPercent === 100)
    highlights.push({ emoji: "🎉", text: `${ranked[0].name} reached their goal!` });

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Welcome back</p>
          <h1 className="text-2xl font-black text-gray-800">{familyName}</h1>
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Log out">
          <LogOut size={20} />
        </button>
      </div>

      {/* Family stats strip */}
      {totalWeighIns > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatChip icon="👥" value={`${profiles.length}`} label="members" />
          <StatChip icon="📊" value={`${totalWeighIns}`} label="check-ins" />
          <StatChip
            icon="📉"
            value={totalKgLost > 0 ? `${totalKgLost} kg` : "—"}
            label="lost together"
          />
        </div>
      )}

      {/* Podium */}
      {podium.length > 0 && (
        <div className="bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🏆</span>
            <div>
              <h2 className="font-black text-gray-800 text-xl leading-tight">Leaderboard</h2>
              <p className="text-xs text-gray-400">Ranked by progress to goal</p>
            </div>
          </div>
          <Podium ranked={podium} onSelect={selectProfile} />
        </div>
      )}

      {/* Positions 4+ */}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          {rest.map((s, i) => (
            <RankedRow
              key={s.profileId}
              stats={s}
              rank={podium.length + i + 1}
              onSelect={() => selectProfile(s.profileId)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {profiles.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">👋</p>
          <p className="font-bold text-gray-600">No one here yet!</p>
          <p className="text-sm mt-1">Be the first to add yourself.</p>
        </div>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">This week</p>
          {highlights.map((h, i) => (
            <HighlightCard key={i} emoji={h.emoji} text={h.text} />
          ))}
        </div>
      )}

      {/* Add myself */}
      <button
        onClick={() => router.push("/profile/new")}
        className="flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-2xl py-4 font-semibold hover:bg-emerald-50 transition-colors"
      >
        <UserPlus size={20} />
        I&apos;m not on the list — add me
      </button>
    </div>
  );
}
