import type { WeeklySummary } from "@/utils/calculations";

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
  isWeightLossGoal: boolean;
}

export default function WeeklySummaryCard({ summary, isWeightLossGoal }: WeeklySummaryCardProps) {
  const { now, weekAgo, delta } = summary;

  if (now == null) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <p className="text-sm font-semibold text-blue-600">Weekly check-in</p>
        <p className="text-xs text-blue-400 mt-0.5">Weigh in a few times to see your weekly change.</p>
      </div>
    );
  }

  if (weekAgo == null) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <p className="text-sm font-semibold text-blue-600">Weekly check-in</p>
        <p className="text-sm font-bold text-blue-700">Trend now: {now.toFixed(1)} kg</p>
        <p className="text-xs text-blue-400 mt-0.5">Keep logging — comparison unlocks after 7 days.</p>
      </div>
    );
  }

  const lost = delta != null && delta < 0;
  const gained = delta != null && delta > 0;
  const unchanged = delta === 0;

  const isGood = (isWeightLossGoal && lost) || (!isWeightLossGoal && gained);
  const isOff  = (isWeightLossGoal && gained) || (!isWeightLossGoal && lost);

  const bg = isGood ? "bg-emerald-50 border-emerald-100" : isOff ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100";
  const textColor = isGood ? "text-emerald-700" : isOff ? "text-red-500" : "text-gray-600";

  let headline = "";
  if (unchanged || delta == null) {
    headline = "No change from 7 days ago";
  } else {
    const abs = Math.abs(delta).toFixed(1);
    headline = lost ? `↓ ${abs} kg since last week` : `↑ ${abs} kg since last week`;
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${bg}`}>
      <span className="text-2xl shrink-0">📊</span>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">7-day change</p>
        <p className={`text-base font-bold ${textColor}`}>{headline}</p>
        <p className="text-xs text-gray-400">
          Trend now: <span className="font-semibold text-gray-600">{now.toFixed(1)} kg</span>
          {" · "}
          7 days ago: <span className="font-semibold text-gray-600">{weekAgo.toFixed(1)} kg</span>
        </p>
      </div>
    </div>
  );
}
