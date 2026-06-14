interface InsightCardProps {
  value: string;
  unit: string;
  title: string;
  description: string;
  accent?: "neutral" | "good" | "bad";
}

export default function InsightCard({
  value,
  unit,
  title,
  description,
  accent = "neutral",
}: InsightCardProps) {
  const valueColor =
    accent === "good" ? "text-emerald-600" : accent === "bad" ? "text-red-500" : "text-gray-800";
  const boxBg =
    accent === "good" ? "bg-emerald-50" : accent === "bad" ? "bg-red-50" : "bg-gray-50";

  return (
    <div className="flex gap-4 items-start">
      <div className={`${boxBg} rounded-2xl w-24 shrink-0 flex flex-col items-center justify-center py-4`}>
        <span className={`text-2xl font-black leading-none ${valueColor}`}>{value}</span>
        <span className="text-xs text-gray-400 mt-1">{unit}</span>
      </div>
      <div className="flex-1 pt-1">
        <h3 className="font-bold text-gray-800 text-lg leading-tight">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-snug">{description}</p>
      </div>
    </div>
  );
}
