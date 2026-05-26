import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin) return NextResponse.json({ error: "PIN required" }, { status: 400 });

    // Normalise on both sides: strip whitespace, uppercase, compare case-insensitively
    const normalised = pin.trim().toUpperCase();
    const { data, error } = await supabase
      .from("families")
      .select("id, name")
      .ilike("pin_code", normalised)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    return NextResponse.json({ family: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
