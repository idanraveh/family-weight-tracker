"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Profile } from "@/lib/types";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const profileId = localStorage.getItem("profileId");
    if (!profileId) { router.replace("/profiles"); return; }

    fetch(`/api/profiles/${profileId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setName(data.profile.name);
          setStartingWeight(data.profile.starting_weight_kg?.toString() ?? "");
          setGoalWeight(data.profile.goal_weight_kg?.toString() ?? "");
        }
      })
      .finally(() => setFetching(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !name.trim()) return;

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
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          startingWeightKg: startingWeight ? sw : null,
          goalWeightKg: goalWeight ? gw : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }

      localStorage.setItem("profileName", name.trim());
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="h-40 bg-gray-100 rounded-2xl animate-pulse mt-10" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Edit profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-2 border-gray-200 focus:border-emerald-400 rounded-2xl py-3 px-4 outline-none text-gray-800 text-lg bg-white"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Starting weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            max="500"
            value={startingWeight}
            onChange={(e) => setStartingWeight(e.target.value)}
            placeholder="e.g. 90.0"
            className="border-2 border-gray-200 focus:border-emerald-400 rounded-2xl py-3 px-4 outline-none text-gray-800 text-lg bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Goal weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            max="500"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            placeholder="e.g. 80.0"
            className="border-2 border-gray-200 focus:border-emerald-400 rounded-2xl py-3 px-4 outline-none text-gray-800 text-lg bg-white"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white font-bold text-lg py-4 rounded-2xl transition-colors mt-2"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
