import type { WeeklySummary } from "@/utils/calculations";

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
  isWeightLossGoal: boolean;
}

export default function WeeklySummaryCard({ summary, isWeightLossGoal }: WeeklySummaryCardProps) {
  const { weeklyRate, now, pointCount, daysSpan } = summary;

  // Not enough data to fit a trend yet
  if (weeklyRate == null || now == null) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <p className="text-sm font-semibold text-blue-600">Weekly pace</p>
        <p className="text-xs text-blue-400 mt-0.5">
          {now == null
            ? "Weigh in a few times to see your pace."
            : "Keep logging — your pace appears after a few days of data."}
        </p>
      </div>
    );
  }

  const losing = weeklyRate < 0;
  const gaining = weeklyRate > 0;
  const flat = Math.abs(weeklyRate) < 0.05;

  const isGood = (isWeightLossGoal && losing) || (!isWeightLossGoal && gaining);
  const isOff = (isWeightLossGoal && gaining) || (!isWeightLossGoal && losing);

  const bg = flat
    ? "bg-gray-50 border-gray-100"
    : isGood
    ? "bg-emerald-50 border-emerald-100"
    : isOff
    ? "bg-red-50 border-red-100"
    : "bg-gray-50 border-gray-100";
  const textColor = flat
    ? "text-gray-600"
    : isGood
    ? "text-emerald-700"
    : isOff
    ? "text-red-500"
    : "text-gray-600";

  const abs = Math.abs(weeklyRate).toFixed(1);
  const headline = flat
    ? "Holding steady"
    : losing
    ? `↓ ${abs} kg / week`
    : `↑ ${abs} kg / week`;

  // Honest about how much data backs the estimate
  const weeks = Math.max(1, Math.round(daysSpan / 7));
  const confidence =
    daysSpan < 7
      ? `Early estimate · ${pointCount} weigh-ins`
      : `Based on ${pointCount} weigh-ins over ${weeks} week${weeks > 1 ? "s" : ""}`;

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${bg}`}>
      <span className="text-2xl shrink-0">📈</span>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Weekly pace</p>
        <p className={`text-base font-bold ${textColor}`}>{headline}</p>
        <p className="text-xs text-gray-400">
          Trend now: <span className="font-semibold text-gray-600">{now.toFixed(1)} kg</span>
          {" · "}
          {confidence}
        </p>
      </div>
    </div>
  );
}
