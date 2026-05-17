interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col gap-1 ${
        highlight ? "bg-emerald-50 border border-emerald-200" : "bg-white border border-gray-100"
      }`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-emerald-700" : "text-gray-800"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
