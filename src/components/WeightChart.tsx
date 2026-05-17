"use client";

import type { TrendPoint } from "@/lib/types";
import { formatDate } from "@/utils/format";

interface WeightChartProps {
  points: TrendPoint[];
  height?: number;
}

const MARGIN = { top: 12, right: 12, bottom: 36, left: 48 };
const VIEW_W = 400;
const VIEW_H = 200;
const PLOT_W = VIEW_W - MARGIN.left - MARGIN.right;
const PLOT_H = VIEW_H - MARGIN.top - MARGIN.bottom;

function niceTicks(min: number, max: number, count = 4): number[] {
  const range = max - min;
  const step = parseFloat((range / count).toPrecision(1));
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.01; v = +(v + step).toFixed(4)) {
    if (v >= min - step * 0.5) ticks.push(+v.toFixed(2));
  }
  return ticks.slice(0, count + 2);
}

export default function WeightChart({ points, height = 200 }: WeightChartProps) {
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-300">
        Add more weigh-ins to see your chart
      </div>
    );
  }

  const allW = points.flatMap((p) => [p.rawWeight, p.trendWeight]);
  const rawMin = Math.min(...allW);
  const rawMax = Math.max(...allW);
  const pad = Math.max((rawMax - rawMin) * 0.15, 1);
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;

  const dates = points.map((p) => new Date(p.date + "T12:00:00Z").getTime());
  const tMin = Math.min(...dates);
  const tMax = Math.max(...dates);

  const xOf = (date: string) => {
    const t = new Date(date + "T12:00:00Z").getTime();
    return MARGIN.left + ((t - tMin) / (tMax - tMin || 1)) * PLOT_W;
  };
  const yOf = (w: number) =>
    MARGIN.top + (1 - (w - yMin) / (yMax - yMin)) * PLOT_H;

  const rawPolyline = points.map((p) => `${xOf(p.date).toFixed(1)},${yOf(p.rawWeight).toFixed(1)}`).join(" ");
  const trendPolyline = points.map((p) => `${xOf(p.date).toFixed(1)},${yOf(p.trendWeight).toFixed(1)}`).join(" ");

  // Y-axis ticks
  const yTicks = niceTicks(yMin, yMax, 4).filter((v) => v >= yMin && v <= yMax);

  // X-axis labels — pick up to 4 evenly spaced points
  const xLabelIdxs = pickEvenly(points.length, 4);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        {/* Grid lines */}
        {yTicks.map((v) => (
          <line
            key={v}
            x1={MARGIN.left}
            x2={MARGIN.left + PLOT_W}
            y1={yOf(v)}
            y2={yOf(v)}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}

        {/* Raw weight line (faded, dashed) */}
        <polyline
          points={rawPolyline}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Raw dots */}
        {points.map((p) => (
          <circle
            key={p.date + "-raw"}
            cx={xOf(p.date)}
            cy={yOf(p.rawWeight)}
            r="2.5"
            fill="#d1d5db"
          />
        ))}

        {/* Trend line (bold, emerald) */}
        <polyline
          points={trendPolyline}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Trend dots at first and last */}
        {[points[0], points[points.length - 1]].map((p, i) => (
          <circle
            key={p.date + "-trend-" + i}
            cx={xOf(p.date)}
            cy={yOf(p.trendWeight)}
            r="4"
            fill="#10b981"
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((v) => (
          <text
            key={"ylabel-" + v}
            x={MARGIN.left - 6}
            y={yOf(v) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#9ca3af"
          >
            {v.toFixed(1)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabelIdxs.map((i) => {
          const p = points[i];
          return (
            <text
              key={"xlabel-" + p.date}
              x={xOf(p.date)}
              y={VIEW_H - MARGIN.bottom + 14}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {shortDate(p.date)}
            </text>
          );
        })}

        {/* Axis line */}
        <line
          x1={MARGIN.left}
          x2={MARGIN.left + PLOT_W}
          y1={MARGIN.top + PLOT_H}
          y2={MARGIN.top + PLOT_H}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      </svg>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0 border-t-2 border-dashed border-gray-300" />
          <span className="text-xs text-gray-400">Daily weight</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0 border-t-2 border-emerald-500" />
          <span className="text-xs text-gray-400">Trend weight</span>
        </div>
      </div>
    </div>
  );
}

function pickEvenly(len: number, count: number): number[] {
  if (len <= count) return Array.from({ length: len }, (_, i) => i);
  const idxs: number[] = [0];
  for (let i = 1; i < count - 1; i++) {
    idxs.push(Math.round((i / (count - 1)) * (len - 1)));
  }
  idxs.push(len - 1);
  return [...new Set(idxs)];
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
}
