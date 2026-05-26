import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { name, pin } = await req.json();
    if (!name || !pin) return NextResponse.json({ error: "Name and PIN required" }, { status: 400 });

    const pinClean = pin.trim();

    // Check PIN is not already taken (case-insensitive)
    const { data: existing } = await supabase
      .from("families")
      .select("id")
      .ilike("pin_code", pinClean)
      .single();

    if (existing) {
      return NextResponse.json({ error: "That code is already taken. Please choose another." }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("families")
      .insert({ name: name.trim(), pin_code: pinClean })
      .select("id, name")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create family" }, { status: 500 });
    }

    return NextResponse.json({ family: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
