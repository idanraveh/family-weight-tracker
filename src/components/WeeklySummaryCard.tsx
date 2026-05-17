import type { WeeklySummary } from "@/utils/calculations";

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
  isWeightLossGoal: boolean;
}

export default function WeeklySummaryCard({ summary, isWeightLossGoal }: WeeklySummaryCardProps) {
  const { thisWeekAvg, lastWeekAvg, delta } = summary;

  if (thisWeekAvg == null) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <p className="text-sm font-semibold text-blue-600">This week</p>
        <p className="text-xs text-blue-400 mt-0.5">Weigh in a few times to see your weekly summary.</p>
      </div>
    );
  }

  const isPositive =
    delta != null &&
    ((isWeightLossGoal && delta < 0) || (!isWeightLossGoal && delta > 0));

  const isNegative =
    delta != null &&
    ((isWeightLossGoal && delta > 0) || (!isWeightLossGoal && delta < 0));

  const bgColor = isPositive ? "bg-emerald-50 border-emerald-100" : isNegative ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100";
  const textColor = isPositive ? "text-emerald-700" : isNegative ? "text-red-500" : "text-blue-600";

  let message = "";
  if (delta == null || lastWeekAvg == null) {
    message = `Avg trend this week: ${thisWeekAvg.toFixed(1)} kg`;
  } else {
    const abs = Math.abs(delta).toFixed(1);
    if (isPositive) message = `Down ${abs} kg from last week 🎉`;
    else if (isNegative) message = `Up ${abs} kg from last week`;
    else message = "Same trend as last week — stay consistent!";
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${bgColor}`}>
      <span className="text-2xl">📊</span>
      <div>
        <p className={`font-semibold text-sm ${textColor}`}>Weekly check-in</p>
        <p className={`text-sm font-bold ${textColor}`}>{message}</p>
        {lastWeekAvg != null && (
          <p className="text-xs text-gray-400 mt-0.5">
            This week {thisWeekAvg.toFixed(1)} kg · Last week {lastWeekAvg.toFixed(1)} kg
          </p>
        )}
      </div>
    </div>
  );
}
