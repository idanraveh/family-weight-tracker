import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId");
  const familyId = req.nextUrl.searchParams.get("familyId");

  // Single profile
  if (profileId) {
    const { data, error } = await supabase
      .from("weigh_ins")
      .select("*")
      .eq("profile_id", profileId)
      .order("date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ weighIns: data });
  }

  // All profiles in a family
  if (familyId) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("family_id", familyId);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ weighInsByProfile: {} });
    }

    const profileIds = profiles.map((p) => p.id);
    const { data, error } = await supabase
      .from("weigh_ins")
      .select("*")
      .in("profile_id", profileIds)
      .order("date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const byProfile: Record<string, typeof data> = {};
    for (const w of data ?? []) {
      if (!byProfile[w.profile_id]) byProfile[w.profile_id] = [];
      byProfile[w.profile_id].push(w);
    }

    return NextResponse.json({ weighInsByProfile: byProfile });
  }

  return NextResponse.json({ error: "profileId or familyId required" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const { profileId, weightKg, date } = await req.json();
    if (!profileId || !weightKg || !date) {
      return NextResponse.json({ error: "profileId, weightKg, and date required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("weigh_ins")
      .insert({ profile_id: profileId, weight_kg: weightKg, date })
      .select("*")
      .single();

    if (error || !data) return NextResponse.json({ error: error?.message ?? "Failed to save" }, { status: 500 });
    return NextResponse.json({ weighIn: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
