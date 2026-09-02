import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const sourceQueries: Record<string, { table: string; select: string }> = {
  membership: { table: "members", select: "id,display_name,source_status" },
  availability: { table: "member_availability_evidence", select: "id,member_id,available_from,available_until" },
  training: { table: "member_currency_evidence", select: "id,member_id,competency_code,status" },
  "asset-register": { table: "assets", select: "id,name,asset_type,status" },
  fleet: { table: "asset_maintenance_evidence", select: "id,asset_id,check_type,status,next_due_at" },
  "asset-checks": { table: "asset_maintenance_evidence", select: "id,asset_id,check_type,status,next_due_at" },
  safety: { table: "safety_compliance_evidence", select: "id,item_name,category,status,next_due_at" },
  oms: { table: "preparedness_plans", select: "id,title,owner_label,status,next_review_at" },
};

type SourceRow = { key: string; record: string; evidence: string; status: string };

function formatRow(source: string, row: Record<string, unknown>): SourceRow {
  const key = String(row.id ?? row.member_id ?? row.asset_id ?? row.title ?? row.item_name);
  if (source === "membership") return { key, record: String(row.display_name), evidence: key, status: String(row.source_status ?? "ONLINE") };
  if (source === "availability") return { key, record: String(row.member_id), evidence: `${String(row.available_from).slice(11, 16)}–${String(row.available_until).slice(11, 16)}`, status: "Declared available" };
  if (source === "training") return { key, record: String(row.member_id), evidence: String(row.competency_code).replaceAll("_", " "), status: String(row.status) };
  if (source === "asset-register") return { key, record: String(row.name), evidence: String(row.asset_type).replaceAll("_", " "), status: String(row.status) };
  if (source === "safety") return { key, record: String(row.item_name), evidence: String(row.category), status: `${String(row.status)} · ${String(row.next_due_at ?? "—").slice(0, 10)}` };
  if (source === "oms") return { key, record: String(row.title), evidence: String(row.owner_label), status: String(row.status) };
  return { key, record: String(row.asset_id), evidence: String(row.check_type), status: `${String(row.status)} · ${String(row.next_due_at ?? "—").slice(0, 10)}` };
}

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("source") ?? "";
  const query = sourceQueries[source];
  if (!query) return NextResponse.json({ error: "Unknown source." }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from(query.table).select(query.select).limit(100);
    if (error) throw error;
    const rows = (data ?? []).map((row) => formatRow(source, row as unknown as Record<string, unknown>));
    const { data: corrections, error: correctionError } = await supabase.from("source_record_corrections").select("record_key,record_label,evidence_label,status_label,is_added,amended_at,amended_by_label").eq("source_id", source);
    const availableCorrections = correctionError ? [] : corrections ?? [];
    const correctionMap = new Map(availableCorrections.map((item) => [item.record_key, item]));
    const corrected = rows.map((row) => {
      const correction = correctionMap.get(row.key);
      return correction ? { key: row.key, record: correction.record_label, evidence: correction.evidence_label, status: correction.status_label } : row;
    });
    availableCorrections.filter((item) => item.is_added && !rows.some((row) => row.key === item.record_key)).forEach((item) => corrected.unshift({ key: item.record_key, record: item.record_label, evidence: item.evidence_label, status: item.status_label }));
    const latestCorrection = [...availableCorrections].sort((left, right) => String(right.amended_at).localeCompare(String(left.amended_at)))[0];
    return NextResponse.json({ source, mode: "supabase", records: corrected, corrections: { count: availableCorrections.length, lastAmendedAt: latestCorrection?.amended_at ?? null, lastAmendedBy: latestCorrection?.amended_by_label ?? null } });
  } catch {
    return NextResponse.json({ source, mode: "fixture", records: [] });
  }
}

export async function POST(request: Request) {
  const body = await request.json() as { source?: string; key?: string; record?: string; evidence?: string; status?: string; isAdded?: boolean };
  if (!body.source || !sourceQueries[body.source] || !body.record || !body.evidence || !body.status) return NextResponse.json({ error: "Source, record, evidence and status are required." }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in is required to amend source data." }, { status: 401 });
    const recordKey = body.key ?? `added-${crypto.randomUUID()}`;
    const { error } = await supabase.from("source_record_corrections").upsert({ source_id: body.source, record_key: recordKey, record_label: body.record, evidence_label: body.evidence, status_label: body.status, is_added: Boolean(body.isAdded), amended_by: user.id, amended_by_label: user.email ?? "Signed-in reviewer", amended_at: new Date().toISOString() }, { onConflict: "source_id,record_key" });
    if (error) throw error;
    return NextResponse.json({ key: recordKey, mode: "supabase" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save source amendment." }, { status: 500 });
  }
}
