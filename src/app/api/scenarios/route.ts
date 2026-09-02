import { NextResponse } from "next/server";
import { demoScenario } from "@/data/demo";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ScenarioChange = { assetId?: string; status?: string };

export async function POST(request: Request) {
  const body = await request.json() as { summary?: string; changes?: ScenarioChange[] };
  if (!body.summary || !Array.isArray(body.changes)) return NextResponse.json({ error: "A scenario summary and changes are required." }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in is required to save a scenario." }, { status: 401 });
    const { data, error } = await supabase.from("scenarios").insert({ home_unit_id: "harbour", title: "Capability scenario", scenario_description: body.summary, starts_at: demoScenario.startAt, ends_at: demoScenario.endAt, constraints: body.changes, created_by: user.id }).select("id,created_at").single();
    if (error) throw error;
    return NextResponse.json({ mode: "supabase", scenario: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save the scenario." }, { status: 500 });
  }
}
