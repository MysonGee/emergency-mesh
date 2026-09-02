import { NextResponse } from "next/server";
import { loadLiveReadiness } from "@/lib/live-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await loadLiveReadiness());
  } catch {
    return NextResponse.json({ mode: "fixture" });
  }
}
