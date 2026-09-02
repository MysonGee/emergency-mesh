import { assets, members } from "@/data/demo";
import { evaluateMainDemoWithEvidence } from "@/domain/network";
import type { AssetStatus, SourceAvailabilityState } from "@/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const assetStatuses = new Set<AssetStatus>(["AVAILABLE", "OFFLINE_UNTIL", "UNSERVICEABLE", "MAINTENANCE_DUE", "IN_USE"]);
const memberStatuses = new Set<SourceAvailabilityState>(["ONLINE", "OFFLINE", "IN_USE"]);

function normaliseAssetStatus(value: string) {
  const upper = value.toUpperCase().replaceAll(" ", "_");
  if (assetStatuses.has(upper as AssetStatus)) return upper as AssetStatus;
  if (upper === "ONLINE") return "AVAILABLE" as AssetStatus;
  if (upper === "OFFLINE") return "OFFLINE_UNTIL" as AssetStatus;
  if (upper.includes("MAINTENANCE")) return "MAINTENANCE_DUE" as AssetStatus;
  return undefined;
}

/** Read-only readiness snapshot from source records and their correction layer. */
export async function loadLiveReadiness() {
  const supabase = await createSupabaseServerClient();
  const [{ data: assetRows, error: assetError }, { data: memberRows, error: memberError }, { data: availabilityRows, error: availabilityError }, { data: corrections, error: correctionError }] = await Promise.all([
    supabase.from("assets").select("id,status,offline_since,offline_until,offline_reason,remaining_usage_hours,capacity_label,source_condition"),
    supabase.from("members").select("id,source_status,training_summary"),
    supabase.from("member_availability_evidence").select("member_id,available_from,available_until,declared_at").order("declared_at", { ascending: false }),
    supabase.from("source_record_corrections").select("source_id,record_key,status_label"),
  ]);
  // The core source snapshot remains useful while the optional correction
  // migration is being introduced to a connected environment.
  if (assetError || memberError || availabilityError) throw assetError ?? memberError ?? availabilityError;
  const assetSource = new Map((assetRows ?? []).map((row) => [row.id, row]));
  const memberSource = new Map((memberRows ?? []).map((row) => [row.id, row]));
  const availabilitySource = new Map((availabilityRows ?? []).map((row) => [row.member_id, row]));
  const correctionMap = new Map((correctionError ? [] : corrections ?? []).map((item) => [`${item.source_id}:${item.record_key}`, item.status_label]));
  const effectiveAssets = assets.map((asset) => {
    const source = assetSource.get(asset.id);
    const correctedStatus = correctionMap.get(`asset-register:${asset.id}`);
    return { ...asset, status: correctedStatus ? normaliseAssetStatus(correctedStatus) ?? asset.status : source?.status && assetStatuses.has(source.status as AssetStatus) ? source.status as AssetStatus : asset.status, offlineSince: source?.offline_since ?? asset.offlineSince, offlineUntil: source?.offline_until ?? asset.offlineUntil, offlineReason: source?.offline_reason ?? asset.offlineReason, remainingUsageHours: source?.remaining_usage_hours == null ? asset.remainingUsageHours : Number(source.remaining_usage_hours), capacity: source?.capacity_label ?? asset.capacity, sourceCondition: source?.source_condition === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" as const : asset.sourceCondition };
  });
  const effectiveMembers = members.map((member) => {
    const source = memberSource.get(member.id);
    const availability = availabilitySource.get(member.id);
    const correctedStatus = correctionMap.get(`membership:${member.id}`)?.toUpperCase();
    const sourceStatus = correctedStatus && memberStatuses.has(correctedStatus as SourceAvailabilityState) ? correctedStatus as SourceAvailabilityState : source?.source_status && memberStatuses.has(source.source_status as SourceAvailabilityState) ? source.source_status as SourceAvailabilityState : member.sourceStatus;
    return { ...member, sourceStatus, availableFrom: availability?.available_from ?? member.availableFrom, availableUntil: availability?.available_until ?? member.availableUntil, trainingSummary: source?.training_summary ?? member.trainingSummary };
  });
  const harbourAssets = effectiveAssets.filter((asset) => asset.unitId === "harbour");
  return {
    mode: "supabase" as const,
    result: evaluateMainDemoWithEvidence({ members: effectiveMembers, assets: effectiveAssets }),
    // These are normalized, read-only source records. The client uses this
    // same snapshot for readiness and evidence views so they cannot disagree.
    members: effectiveMembers,
    assets: effectiveAssets,
    summary: {
      onlineAssets: harbourAssets.filter((asset) => asset.status === "AVAILABLE").length,
      offlineAssets: harbourAssets.filter((asset) => asset.status === "OFFLINE_UNTIL").length,
      maintenanceAssets: harbourAssets.filter((asset) => asset.status === "MAINTENANCE_DUE").length,
      membersAvailable: effectiveMembers.filter((member) => member.unitId === "harbour" && member.sourceStatus !== "OFFLINE" && member.sourceStatus !== "IN_USE").length,
    },
  };
}
