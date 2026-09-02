import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("source_correction_events").select("source_id,record_key,action,previous_value,next_value,actor_label,occurred_at").order("occurred_at", { ascending: false }).limit(30);
    if (error) throw error;
    return NextResponse.json({ mode: "supabase", events: data ?? [] });
  } catch {
    return NextResponse.json({ mode: "unavailable", events: [] });
  }
}
