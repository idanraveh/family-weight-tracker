"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { WeightChangeWindow } from "@/utils/calculations";
import Sparkline from "./Sparkline";

interface WeightChangesTableProps {
  windows: WeightChangeWindow[];
  isWeightLossGoal: boolean;
}

const LABELS: Record<number, string> = {
  3: "3-day",
  7: "7-day",
  14: "14-day",
  30: "30-day",
  90: "90-day",
};

export default function WeightChangesTable({ windows, isWeightLossGoal }: WeightChangesTableProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Weight Changes</h2>
      <div className="flex flex-col divide-y divide-gray-50">
        {windows.map((w) => {
          const isGood =
            w.direction !== "flat" &&
            ((isWeightLossGoal && w.direction === "down") ||
              (!isWeightLossGoal && w.direction === "up"));
          const isBad =
            w.direction !== "flat" &&
            ((isWeightLossGoal && w.direction === "up") ||
              (!isWeightLossGoal && w.direction === "down"));

          const arrowColor = isGood ? "text-emerald-500" : isBad ? "text-red-400" : "text-gray-300";
          const sparkColor = isGood ? "#10b981" : isBad ? "#f87171" : "#9ca3af";

          const Icon =
            w.direction === "up" ? TrendingUp : w.direction === "down" ? TrendingDown : Minus;
          const dirLabel =
            w.direction === "up" ? "Increase" : w.direction === "down" ? "Decrease" : "No change";

          return (
            <div key={w.days} className="flex items-center gap-3 py-3">
              <span className="text-sm text-gray-400 w-12 shrink-0">{LABELS[w.days]}</span>

              <div className="w-16 shrink-0 flex justify-center">
                {w.sparkline.length >= 2 ? (
                  <Sparkline data={w.sparkline} color={sparkColor} width={56} height={24} />
                ) : (
                  <span className="text-gray-200 text-xs">—</span>
                )}
              </div>

              <span className="flex-1 font-bold text-gray-800 text-base">
                {w.change == null
                  ? "—"
                  : `${w.change > 0 ? "+" : ""}${w.change.toFixed(1)} kg`}
              </span>

              <div className={`flex items-center gap-1 ${arrowColor} w-24 justify-end shrink-0`}>
                <Icon size={16} />
                <span className="text-sm">{dirLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-300 mt-3">
        Each row compares your current trend weight to that many days ago.
      </p>
    </div>
  );
}
