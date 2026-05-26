"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("familyId");
    if (stored) router.replace("/profiles");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/family/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.family) {
        setError("Family code not found. Please try again.");
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="bg-emerald-100 rounded-full p-5">
          <Scale className="text-emerald-600" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Family Tracker</h1>
        <p className="text-gray-500 text-center text-sm max-w-xs">
          Track your weight together, support each other, reach your goals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">Family code</label>
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase())}
            placeholder="ENTER YOUR FAMILY CODE"
            className="text-2xl text-center font-bold tracking-widest border-2 border-gray-200 focus:border-emerald-400 rounded-2xl py-4 px-4 outline-none bg-white text-gray-800"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !pin.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 text-white font-bold text-lg py-4 rounded-2xl transition-colors"
        >
          {loading ? "Checking…" : "Join family"}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center">
        Ask a family member for the code, or create a new family below.
      </p>

      <button
        onClick={() => router.push("/create-family")}
        className="text-emerald-600 underline text-sm"
      >
        Create a new family
      </button>
    </div>
  );
}
