"use client";

import { useEffect, useState } from "react";
import { assets, members } from "@/data/demo";
import { complianceEvidence, maintenanceEvidence } from "@/data/preparedness";
import { compareSupportScenario, evaluateMainDemo, findMinimumInterventions, findNeighbourSupport, findSinglePointsOfFailure, simulateResourceUnavailable } from "@/domain/network";

declare global {
  interface Document {
    modelContext?: { registerTool: (tool: { name: string; description: string; inputSchema: Record<string, unknown>; execute: (input: Record<string, unknown>) => Promise<unknown> }) => Promise<void> };
  }
}

const emptySchema = { type: "object", properties: {} };
export function WebMcpBridge({ showStatus = true }: { showStatus?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [lastAction, setLastAction] = useState("Browser-tool registration is waiting for the host.");
  const [lastResult, setLastResult] = useState("");
  useEffect(() => {
    let registered = false;
    const register = async (context: NonNullable<Document["modelContext"]>) => {
      const report = (action: string, value: unknown) => {
        setLastAction(action);
        setLastResult(Array.isArray(value) ? `${value.length} option(s) returned.` : typeof value === "object" && value ? "Deterministic result returned to the agent." : String(value));
        window.dispatchEvent(new CustomEvent("emergency-mesh-tool-result", { detail: { action, value } }));
        return value;
      };
      await context.registerTool({ name: "get_unit_readiness", description: "Return deterministic fictional Harbour Station readiness.", inputSchema: emptySchema, execute: async () => report("Agent requested station readiness", evaluateMainDemo()) });
      await context.registerTool({ name: "get_people_and_asset_evidence", description: "Return declared member and asset evidence for the fictional Harbour station. This is read-only and does not create a roster, alter an asset, or change a source system.", inputSchema: emptySchema, execute: async () => report("Agent requested people and asset evidence", { members: members.filter((member) => member.unitId === "harbour").map(({ id, name, sourceStatus, unitId }) => ({ id, name, sourceStatus, unitId })), assets: assets.filter((asset) => asset.unitId === "harbour").map(({ id, name, type, status, offlineUntil, offlineSince, offlineReason }) => ({ id, name, type, status, offlineUntil, offlineSince, offlineReason })) }) });
      await context.registerTool({ name: "get_preparedness_horizon", description: "Return read-only fictional maintenance and inspection evidence that affects future readiness. It cannot create maintenance work or clear an asset.", inputSchema: emptySchema, execute: async () => report("Agent requested preparedness horizon", maintenanceEvidence) });
      await context.registerTool({ name: "get_safety_compliance_horizon", description: "Return read-only fictional safety and compliance evidence, including current and due-soon expiries. It cannot certify compliance or create work.", inputSchema: { type: "object", properties: { horizon_days: { type: "number", description: "Optional advisory horizon in days: 7, 30, or 90." } } }, execute: async (input) => report("Agent requested safety and compliance horizon", { horizonDays: [7, 30, 90].includes(Number(input.horizon_days)) ? Number(input.horizon_days) : 90, evidence: complianceEvidence }) });
      await context.registerTool({ name: "open_weather_capability_review", description: "Open the fictional Harbour capability review from a weather awareness prompt. This only reveals the scenario; it cannot activate volunteers, dispatch resources, or create incident tasks.", inputSchema: emptySchema, execute: async () => report("Agent opened the weather capability review", { status: "REVIEW_OPEN", uiEffect: "open_weather_review", humanReviewRequired: true }) });
      await context.registerTool({ name: "evaluate_capability_plan", description: "Evaluate the canonical simultaneous capability plan using deterministic constraints.", inputSchema: emptySchema, execute: async () => report("Agent evaluated the canonical plan", evaluateMainDemo()) });
      await context.registerTool({ name: "simulate_resource_unavailable", description: "Run a scenario-only deterministic calculation after a named fictional member or asset becomes unavailable. It never changes a source system, activates volunteers, or creates operational work.", inputSchema: { type: "object", properties: { resource_id: { type: "string", description: "Fictional member or asset id, for example H07 or H-C01." } }, required: ["resource_id"] }, execute: async (input) => report(`Agent simulated ${String(input.resource_id)} unavailable`, simulateResourceUnavailable(String(input.resource_id))) });
      await context.registerTool({ name: "find_single_points_of_failure", description: "Identify deterministic capability dependencies needing human review in the fictional Harbour scenario.", inputSchema: emptySchema, execute: async () => report("Agent checked single points of failure", findSinglePointsOfFailure()) });
      await context.registerTool({ name: "compare_support_scenario", description: "Compare the current fictional result with a time-bounded shared-support assumption. This is analysis only and never transfers or allocates a resource.", inputSchema: emptySchema, execute: async () => report("Agent compared the shared-support scenario", compareSupportScenario()) });
      await context.registerTool({ name: "find_minimum_interventions", description: "Find ranked, human-approved interventions for the canonical plan.", inputSchema: emptySchema, execute: async () => report("Agent searched minimum interventions", findMinimumInterventions()) });
      await context.registerTool({ name: "find_neighbour_support", description: "Find shareable local support; excludes offline options and anything that would breach supplying-station readiness.", inputSchema: emptySchema, execute: async () => report("Agent searched local support", findNeighbourSupport()) });
      await context.registerTool({ name: "draft_support_request", description: "Prepare a visible support-request draft for human review only. It never transfers, allocates, or approves a resource.", inputSchema: { type: "object", properties: { resource_id: { type: "string" } }, required: ["resource_id"] }, execute: async (input) => report(`Agent prepared a support draft for ${String(input.resource_id)}`, { status: "DRAFT", resourceId: input.resource_id, uiEffect: "draft_support_request", humanApprovalRequired: true }) });
      await context.registerTool({ name: "open_support_request_review", description: "Open the visible Local support review for a human to assess a prepared draft. This tool cannot approve, send, transfer, or allocate anything.", inputSchema: emptySchema, execute: async () => report("Agent opened the support request review", { status: "REVIEW_OPEN", uiEffect: "open_support_review", humanApprovalRequired: true }) });
      setEnabled(true);
    };
    const waitForHost = () => {
      if (registered || !document.modelContext) return;
      registered = true;
      window.clearInterval(timer);
      void register(document.modelContext);
    };
    const timer = window.setInterval(waitForHost, 500);
    waitForHost();
    return () => window.clearInterval(timer);
  }, []);
  if (!showStatus) return null;
  return <div className={`status ${enabled ? "" : "muted"}`} aria-live="polite"><p><span /> {enabled ? "Browser tools registered" : "Browser-tool connection pending"}</p><small>{lastAction}</small>{lastResult && <small>{lastResult}</small>}</div>;
}
