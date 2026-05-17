"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { WeighIn } from "@/lib/types";
import { formatDate, todayISO } from "@/utils/format";

interface RecentWeighInsProps {
  weighIns: WeighIn[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, weightKg: number, date: string) => Promise<void>;
}

export default function RecentWeighIns({ weighIns, onDelete, onEdit }: RecentWeighInsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

  const recent = [...weighIns]
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  function startEdit(w: WeighIn) {
    setEditingId(w.id);
    setEditWeight(w.weight_kg.toString());
    setEditDate(w.date);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditWeight("");
    setEditDate("");
  }

  async function saveEdit(id: string) {
    const kg = parseFloat(editWeight);
    if (isNaN(kg) || kg <= 0 || kg > 500) return;
    setSaving(true);
    try {
      await onEdit(id, kg, editDate);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  if (recent.length === 0) {
    return (
      <div className="text-center text-gray-400 py-6 text-sm">
        No weigh-ins yet. Add your first one above!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-gray-700">Recent weigh-ins</h2>
      <div className="flex flex-col divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {recent.map((w) => {
          const isEditing = editingId === w.id;

          if (isEditing) {
            return (
              <div key={w.id} className="px-4 py-3 bg-emerald-50 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="1"
                    max="500"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-28 border-2 border-emerald-300 rounded-xl px-2 py-1 text-lg font-bold text-gray-800 outline-none focus:border-emerald-500 bg-white"
                    autoFocus
                  />
                  <span className="self-center text-gray-500 font-medium">kg</span>
                  <input
                    type="date"
                    value={editDate}
                    max={todayISO()}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="flex-1 border-2 border-emerald-300 rounded-xl px-2 py-1 text-sm text-gray-700 outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(w.id)}
                    disabled={saving}
                    className="flex items-center gap-1 bg-emerald-500 text-white rounded-xl px-3 py-1.5 text-sm font-semibold"
                  >
                    <Check size={14} /> Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 bg-gray-100 text-gray-600 rounded-xl px-3 py-1.5 text-sm font-semibold"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={w.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-semibold text-gray-800">{w.weight_kg.toFixed(1)} kg</p>
                <p className="text-xs text-gray-400">{formatDate(w.date)}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(w)}
                  className="p-2 text-gray-300 hover:text-blue-400 transition-colors"
                  aria-label="Edit weigh-in"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => onDelete(w.id)}
                  className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                  aria-label="Delete weigh-in"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
