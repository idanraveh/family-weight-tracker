"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, LogOut } from "lucide-react";
import type { Profile } from "@/lib/types";

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async (familyId: string) => {
    try {
      const res = await fetch(`/api/profiles?familyId=${familyId}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const familyId = localStorage.getItem("familyId");
    const name = localStorage.getItem("familyName");

    if (!familyId) {
      router.replace("/");
      return;
    }

    setFamilyName(name ?? "Your family");
    loadProfiles(familyId);
  }, [router, loadProfiles]);

  function selectProfile(profile: Profile) {
    localStorage.setItem("profileId", profile.id);
    localStorage.setItem("profileName", profile.name);
    router.push("/dashboard");
  }

  function logout() {
    localStorage.removeItem("familyId");
    localStorage.removeItem("familyName");
    localStorage.removeItem("profileId");
    localStorage.removeItem("profileName");
    router.replace("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{familyName}</h1>
          <p className="text-gray-500 text-sm">Who&apos;s weighing in today?</p>
        </div>
        <button
          onClick={logout}
          className="p-2 text-gray-400 hover:text-gray-600"
          aria-label="Log out"
        >
          <LogOut size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProfile(p)}
              className="flex items-center justify-between bg-white border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl px-5 py-4 text-left transition-colors"
            >
              <div>
                <p className="font-bold text-gray-800 text-lg">{p.name}</p>
                {p.goal_weight_kg && (
                  <p className="text-xs text-gray-400">Goal: {p.goal_weight_kg} kg</p>
                )}
              </div>
              <span className="text-2xl">→</span>
            </button>
          ))}

          {profiles.length === 0 && (
            <p className="text-center text-gray-400 py-8">
              No profiles yet. Add yourself below!
            </p>
          )}

          <button
            onClick={() => router.push("/profile/new")}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-2xl py-4 font-semibold hover:bg-emerald-50 transition-colors"
          >
            <UserPlus size={20} />
            Add myself
          </button>
        </div>
      )}
    </div>
  );
}
