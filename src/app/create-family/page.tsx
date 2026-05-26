"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function CreateFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !pin.trim()) return;
    if (pin.trim().length < 4) {
      setError("Code must be at least 4 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), pin: pin.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      localStorage.setItem("familyId", data.family.id);
      localStorage.setItem("familyName", data.family.name);
      router.push("/profiles");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Create your family</h1>
        <p className="text-gray-500 text-sm mt-1">
          Set a family name and a code your family will use to log in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Family name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Smiths"
            className="border-2 border-gray-200 focus:border-emerald-400 rounded-2xl py-3 px-4 outline-none text-gray-800 text-lg bg-white"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Family code (shared secret)</label>
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="e.g. smith2024"
            maxLength={20}
            className="border-2 border-gray-200 focus:border-emerald-400 rounded-2xl py-3 px-4 outline-none text-gray-800 text-lg tracking-widest bg-white"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <p className="text-xs text-gray-400">Share this code with your family members.</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim() || !pin.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white font-bold text-lg py-4 rounded-2xl transition-colors mt-2"
        >
          {loading ? "Creating…" : "Create family"}
        </button>
      </form>
    </div>
  );
}
