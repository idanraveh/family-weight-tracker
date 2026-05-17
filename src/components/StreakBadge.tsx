interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">📅</span>
        <div>
          <p className="font-semibold text-gray-600">No active streak</p>
          <p className="text-xs text-gray-400">Weigh in today to start one!</p>
        </div>
      </div>
    );
  }

  const emoji = streak >= 30 ? "🔥🔥🔥" : streak >= 14 ? "🔥🔥" : "🔥";
  const label =
    streak >= 30
      ? "Incredible consistency!"
      : streak >= 14
      ? "Two weeks strong!"
      : streak >= 7
      ? "One week streak!"
      : streak >= 3
      ? "Keep it going!"
      : "Great start!";

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-3xl">{emoji}</span>
      <div>
        <p className="font-bold text-orange-700 text-lg leading-tight">
          {streak}-day streak
        </p>
        <p className="text-xs text-orange-500">{label}</p>
      </div>
    </div>
  );
}
