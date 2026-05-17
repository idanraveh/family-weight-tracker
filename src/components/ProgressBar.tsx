interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span className="font-semibold text-emerald-700">{clamped.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
