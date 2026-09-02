import type { Asset, BindingConstraint, CapabilityDefinition, CapabilityDemand, CapabilityPlanResult, Member, TimeWindow, UnitId } from "./types";

export const capabilityDefinitions: CapabilityDefinition[] = [
  { id: "FLOOD_RESCUE", name: "Flood Rescue Team", requiredCompetencies: [{ code: "FLOOD_RESCUE", quantity: 3 }], requiredAssets: [] },
  { id: "CHAINSAW", name: "Chainsaw Team", requiredCompetencies: [{ code: "CHAINSAW", quantity: 3 }], requiredAssets: [{ type: "CHAINSAW", quantity: 1 }] },
  { id: "SPECIALIST_TRUCK", name: "Specialist Truck Crew", requiredCompetencies: [{ code: "SPECIALIST_DRIVER", quantity: 1 }], requiredAssets: [{ type: "SPECIALIST_TRUCK", quantity: 1 }] },
  { id: "STORM", name: "Storm Team", requiredCompetencies: [{ code: "STORM_RESPONSE", quantity: 3 }], requiredAssets: [] },
];

function hoursBetween(window: TimeWindow) { return (Date.parse(window.endAt) - Date.parse(window.startAt)) / 3_600_000; }

function isMemberEligible(member: Member, window: TimeWindow) {
  return member.sourceStatus !== "OFFLINE"
    && member.sourceStatus !== "IN_USE"
    && member.trainingCurrency !== "LAPSED"
    && Date.parse(member.availableFrom) <= Date.parse(window.startAt)
    && Date.parse(member.availableUntil) >= Date.parse(window.endAt)
    && member.activityHoursBeforeWindow + hoursBetween(window) <= member.maximumContinuousHours;
}

function assetFailure(asset: Asset, window: TimeWindow, expectedUsageHours = 0) {
  if (asset.status === "IN_USE") return "in_use";
  if (asset.status === "OFFLINE_UNTIL" && asset.offlineUntil && Date.parse(asset.offlineUntil) > Date.parse(window.startAt)) return "offline";
  if (asset.status !== "AVAILABLE") return "unserviceable";
  if (asset.remainingUsageHours !== undefined && expectedUsageHours > asset.remainingUsageHours) return "maintenance";
  return undefined;
}

/** Deterministic, priority-ordered allocation. One resource may occupy only one simultaneous role. */
export function evaluateCapabilityPlan(input: { homeUnitId: UnitId; demands: CapabilityDemand[]; window: TimeWindow; members: Member[]; assets: Asset[] }): CapabilityPlanResult {
  const definitions = new Map(capabilityDefinitions.map((definition) => [definition.id, definition]));
  const homeMembers = input.members.filter((member) => member.unitId === input.homeUnitId);
  const homeAssets = input.assets.filter((asset) => asset.unitId === input.homeUnitId);
  const constraints: BindingConstraint[] = [];
  const allocations: CapabilityPlanResult["allocations"] = [];
  const usedMembers = new Set<string>();
  const usedAssets = new Set<string>();

  for (const demand of [...input.demands].sort((a, b) => b.priority - a.priority)) {
    const definition = definitions.get(demand.capabilityId);
    if (!definition) continue;
    for (let packageIndex = 0; packageIndex < demand.quantity; packageIndex += 1) {
      for (const requirement of definition.requiredCompetencies) {
        const eligible = homeMembers.filter((member) => member.competencies.includes(requirement.code) && isMemberEligible(member, input.window));
        const available = eligible.filter((member) => !usedMembers.has(member.id));
        if (available.length < requirement.quantity) {
          const fatigued = homeMembers.filter((member) => member.competencies.includes(requirement.code) && member.activityHoursBeforeWindow + hoursBetween(input.window) > member.maximumContinuousHours);
          const overlapping = eligible.filter((member) => usedMembers.has(member.id));
          constraints.push({ type: overlapping.length ? "SHARED_MEMBER_CONFLICT" : fatigued.length ? "FATIGUE_LIMIT" : "INSUFFICIENT_QUALIFIED_MEMBERS", message: overlapping.length ? `${overlapping.map((member) => member.name).join(", ")} cannot fill another simultaneous ${requirement.code} role.` : fatigued.length ? `${fatigued.map((member) => member.name).join(", ")} would exceed the configured fatigue horizon before the requested end time.` : `Only ${available.length} eligible ${requirement.code} member(s) are available; ${requirement.quantity} are required.`, resourceIds: [...overlapping, ...fatigued].map((member) => member.id), earliestConstraintAt: fatigued[0] ? new Date(Date.parse(input.window.startAt) + (fatigued[0].maximumContinuousHours - fatigued[0].activityHoursBeforeWindow) * 3_600_000).toISOString() : undefined });
          continue;
        }
        available.slice(0, requirement.quantity).forEach((member) => { usedMembers.add(member.id); allocations.push({ demand: definition.id, role: requirement.code, memberId: member.id }); });
      }
      for (const requirement of definition.requiredAssets) {
        const candidates = homeAssets.filter((asset) => asset.type === requirement.type);
        const usable = candidates.filter((asset) => !usedAssets.has(asset.id) && !assetFailure(asset, input.window, requirement.expectedUsageHours ?? hoursBetween(input.window)));
        if (usable.length < requirement.quantity) {
          const maintenance = candidates.filter((asset) => assetFailure(asset, input.window, requirement.expectedUsageHours ?? hoursBetween(input.window)) === "maintenance");
          const offline = candidates.filter((asset) => assetFailure(asset, input.window, requirement.expectedUsageHours ?? hoursBetween(input.window)) === "offline");
          const inUse = candidates.filter((asset) => assetFailure(asset, input.window, requirement.expectedUsageHours ?? hoursBetween(input.window)) === "in_use");
          constraints.push({ type: maintenance.length ? "ASSET_MAINTENANCE_HORIZON" : offline.length || inUse.length ? "ASSET_OFFLINE" : "INSUFFICIENT_ASSETS", message: maintenance.length ? `${maintenance.map((asset) => asset.name).join(", ")} would cross its configured maintenance threshold during this plan.` : offline.length ? `${offline.map((asset) => asset.name).join(", ")} is offline for the requested window.` : inUse.length ? `${inUse.map((asset) => asset.name).join(", ")} is deployed and cannot be included in this capability offer.` : `No suitable unallocated ${requirement.type} asset is available.`, resourceIds: [...maintenance, ...offline, ...inUse].map((asset) => asset.id) });
          continue;
        }
        usable.slice(0, requirement.quantity).forEach((asset) => { usedAssets.add(asset.id); allocations.push({ demand: definition.id, role: requirement.type, assetId: asset.id }); });
      }
    }
  }
  return { feasible: constraints.length === 0, allocations, bindingConstraints: constraints, warnings: [], assumptions: ["All fatigue and maintenance thresholds are fictional and configurable.", "No person or asset is allocated to more than one simultaneous role."] };
}
