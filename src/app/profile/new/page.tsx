"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function NewProfilePage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState("");
  const [name, setName] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("familyId");
    if (!id) { router.replace("/"); return; }
    setFamilyId(id);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const sw = parseFloat(startingWeight);
    const gw = parseFloat(goalWeight);

    if (startingWeight && (isNaN(sw) || sw <= 0 || sw > 500)) {
      setError("Starting weight must be between 1 and 500 kg.");
      return;
    }
    if (goalWeight && (isNaN(gw) || gw <= 0 || gw > 500)) {
      setError("Goal weight must be between 1 and 500 kg.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          name: name.trim(),
          startingWeightKg: startingWeight ? sw : null,
          goalWeightKg: goalWeight ? gw : null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      localStorage.setItem("profileId", data.profile.id);
      localStorage.setItem("profileName", data.profile.name);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Add your profile</h1>
        <p className="text-gray-500 text-sm mt-1">Just the basics — you can edit these later.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Your name" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Idan"
            className="input"
            required
          />
        </Field>

        <Field label="Starting weight (kg)" hint="Optional — helps track progress accurately">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            max="500"
            value={startingWeight}
            onChange={(e) => setStartingWeight(e.target.value)}
            placeholder="e.g. 90.0"
            className="input"
          />
        </Field>

        <Field label="Goal weight (kg)" hint="Optional">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            max="500"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            placeholder="e.g. 80.0"
            className="input"
          />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white font-bold text-lg py-4 rounded-2xl transition-colors mt-2"
        >
          {loading ? "Creating…" : "Create profile"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
