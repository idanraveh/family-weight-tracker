import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { weightKg, date } = await req.json();
    const { data, error } = await supabase
      .from("weigh_ins")
      .update({ weight_kg: weightKg, date })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return NextResponse.json({ error: error?.message ?? "Failed to update" }, { status: 500 });
    return NextResponse.json({ weighIn: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("weigh_ins").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
