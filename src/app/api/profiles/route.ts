import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const familyId = req.nextUrl.searchParams.get("familyId");
  if (!familyId) return NextResponse.json({ error: "familyId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profiles: data });
}

export async function POST(req: NextRequest) {
  try {
    const { familyId, name, startingWeightKg, goalWeightKg } = await req.json();
    if (!familyId || !name) return NextResponse.json({ error: "familyId and name required" }, { status: 400 });

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        family_id: familyId,
        name: name.trim(),
        starting_weight_kg: startingWeightKg ?? null,
        goal_weight_kg: goalWeightKg ?? null,
      })
      .select("*")
      .single();

    if (error || !data) return NextResponse.json({ error: error?.message ?? "Failed to create" }, { status: 500 });
    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
