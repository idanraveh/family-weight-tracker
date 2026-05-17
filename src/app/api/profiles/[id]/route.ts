import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { name, startingWeightKg, goalWeightKg } = await req.json();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: name?.trim(),
        starting_weight_kg: startingWeightKg ?? null,
        goal_weight_kg: goalWeightKg ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return NextResponse.json({ error: error?.message ?? "Failed to update" }, { status: 500 });
    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
