"use client";

import { useState } from "react";
import { todayISO } from "@/utils/format";

interface WeighInFormProps {
  onSave: (weightKg: number, date: string) => Promise<void>;
  todayWeight?: number | null;
}

export default function WeighInForm({ onSave, todayWeight }: WeighInFormProps) {
  const [weight, setWeight] = useState(todayWeight ? String(todayWeight) : "");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const kg = parseFloat(weight);
    if (isNaN(kg) || kg <= 0 || kg > 500) {
      setError("Please enter a valid weight between 1 and 500 kg.");
      return;
    }

    setSaving(true);
    try {
      await onSave(kg, date);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-700">Log today&apos;s weight</h2>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-500">Weight (kg)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max="500"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 82.5"
          className="text-3xl font-bold text-gray-800 border-b-2 border-emerald-400 focus:border-emerald-600 outline-none py-2 w-full bg-transparent"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-500">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={todayISO()}
          className="text-base border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {success && (
        <p className="text-sm font-medium text-emerald-600">
          ✓ Weigh-in saved!
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-lg py-4 rounded-2xl transition-colors"
      >
        {saving ? "Saving…" : "Save weigh-in"}
      </button>
    </form>
  );
}
