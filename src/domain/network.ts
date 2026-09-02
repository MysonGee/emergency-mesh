import { assets, members, units, demoScenario } from "@/data/demo";
import type { Asset } from "./types";
import { evaluateCapabilityPlan } from "./engine";

export const mainDemands = [
  { capabilityId: "FLOOD_RESCUE" as const, quantity: 1, priority: 4 },
  { capabilityId: "CHAINSAW" as const, quantity: 1, priority: 3 },
  { capabilityId: "SPECIALIST_TRUCK" as const, quantity: 1, priority: 2 },
  { capabilityId: "STORM" as const, quantity: 1, priority: 1 },
];

export function evaluateMainDemo() {
  return evaluateMainDemoWithAssets(assets);
}

/** Planning-only evaluation. Asset changes exist only in the browser snapshot. */
export function evaluateMainDemoWithAssets(planningAssets: Asset[]) {
  return evaluateCapabilityPlan({ homeUnitId: "harbour", demands: mainDemands, window: { startAt: demoScenario.startAt, endAt: demoScenario.endAt }, members, assets: planningAssets });
}

/** Read-only source-adapter entry point. The caller supplies normalized source evidence. */
export function evaluateMainDemoWithEvidence(evidence: { members: typeof members; assets: Asset[] }) {
  return evaluateCapabilityPlan({ homeUnitId: "harbour", demands: mainDemands, window: { startAt: demoScenario.startAt, endAt: demoScenario.endAt }, members: evidence.members, assets: evidence.assets });
}

export function findNeighbourSupport() {
  return assets.filter((asset) => asset.unitId !== "harbour" && asset.type === "SPECIALIST_TRUCK" && asset.status === "AVAILABLE").map((asset) => {
    const donor = units.find((unit) => unit.id === asset.unitId)!;
    const available = assets.filter((candidate) => candidate.unitId === donor.id && candidate.type === "SPECIALIST_TRUCK" && candidate.status === "AVAILABLE");
    const remaining = available.length - 1;
    return { resourceId: asset.id, resourceName: asset.name, supplyingUnitId: donor.id, supplyingUnitName: donor.name, eligible: remaining >= donor.minimumReadiness, donorImpact: { availableBefore: available.length, availableAfter: remaining, minimumReadiness: donor.minimumReadiness }, reason: remaining >= donor.minimumReadiness ? "Available for the requested window; donor remains above its configured minimum." : "Excluded because lending would breach donor minimum readiness." };
  }).filter((option) => option.eligible);
}

export function findMinimumInterventions() {
  const support = findNeighbourSupport();
  const driver = members.find((member) => member.id === "V04")!;
  return [
    ...support.map((option) => ({ rank: 1, type: "VEHICLE_SUPPORT", label: `Request ${option.resourceName}`, detail: option.reason, resourceId: option.resourceId })),
    { rank: 2, type: "MEMBER_SUPPORT", label: `Request specialist driver from Unit Valley`, detail: `${driver.name} is a fictional eligible specialist-driver candidate; approval remains required.`, resourceId: driver.id },
  ];
}

/** Scenario-only recalculation. It records an assumed source-data change; it never changes a source system. */
export function simulateResourceUnavailable(resourceId: string) {
  const changedAssets = assets.map((asset) => asset.id === resourceId ? { ...asset, status: "OFFLINE_UNTIL" as const, offlineUntil: demoScenario.endAt } : asset);
  const changedMembers = members.map((member) => member.id === resourceId ? { ...member, availableUntil: demoScenario.startAt } : member);
  const result = evaluateCapabilityPlan({ homeUnitId: "harbour", demands: mainDemands, window: { startAt: demoScenario.startAt, endAt: demoScenario.endAt }, members: changedMembers, assets: changedAssets });
  return { status: "SCENARIO_ONLY", resourceId, result, note: "This is a simulated source-data change. No availability, asset, or operational system was changed." };
}

export function findSinglePointsOfFailure() {
  return [
    { resourceId: "H-S01", resourceName: "Harbour Specialist 01", finding: "Specialist truck capability has no local substitute for the requested window.", currentState: "Offline", reviewRequired: true },
    { resourceId: "H07", resourceName: "Avery Cole", finding: "Multi-skill qualification supports more than one requested capability but may only contribute to one simultaneous role.", currentState: "Available", reviewRequired: true },
  ];
}

export function compareSupportScenario() {
  const baseline = evaluateMainDemo();
  const supportedAssets = assets.map((asset) => asset.id === "R02" ? { ...asset, unitId: "harbour" as const } : asset);
  const supported = evaluateCapabilityPlan({ homeUnitId: "harbour", demands: mainDemands, window: { startAt: demoScenario.startAt, endAt: demoScenario.endAt }, members, assets: supportedAssets });
  return {
    status: "SCENARIO_COMPARISON",
    baseline: { feasible: baseline.feasible, constraints: baseline.bindingConstraints.length },
    donorSafeOption: { resourceId: "R02", resourceName: "Ridge Specialist 02", donorRemainsAtMinimum: true },
    supportedScenario: { feasible: supported.feasible, constraints: supported.bindingConstraints.length },
    note: "Comparison assumes a time-bounded, human-approved support option. It does not transfer, allocate, or direct the resource.",
  };
}
