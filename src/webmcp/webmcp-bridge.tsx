"use client";

import { useEffect, useState } from "react";
import { compareSupportScenario, evaluateMainDemo, findMinimumInterventions, findNeighbourSupport, findSinglePointsOfFailure, simulateResourceUnavailable } from "@/domain/network";

declare global {
  interface Document {
    modelContext?: { registerTool: (tool: { name: string; description: string; inputSchema: Record<string, unknown>; execute: (input: Record<string, unknown>) => Promise<unknown> }) => Promise<void> };
  }
}

const emptySchema = { type: "object", properties: {} };
export function WebMcpBridge() {
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
      await context.registerTool({ name: "open_weather_capability_review", description: "Open the fictional Harbour capability review from a weather awareness prompt. This only reveals the scenario; it cannot activate volunteers, dispatch resources, or create incident tasks.", inputSchema: emptySchema, execute: async () => report("Agent opened the weather capability review", { status: "REVIEW_OPEN", uiEffect: "open_weather_review", humanReviewRequired: true }) });
      await context.registerTool({ name: "evaluate_capability_plan", description: "Evaluate the canonical simultaneous capability plan using deterministic constraints.", inputSchema: emptySchema, execute: async () => report("Agent evaluated the canonical plan", evaluateMainDemo()) });
      await context.registerTool({ name: "simulate_resource_unavailable", description: "Run a scenario-only deterministic calculation after a named fictional member or asset becomes unavailable. It never changes a source system, activates volunteers, or creates operational work.", inputSchema: { type: "object", properties: { resource_id: { type: "string", description: "Fictional member or asset id, for example H07 or H-C01." } }, required: ["resource_id"] }, execute: async (input) => report(`Agent simulated ${String(input.resource_id)} unavailable`, simulateResourceUnavailable(String(input.resource_id))) });
      await context.registerTool({ name: "find_single_points_of_failure", description: "Identify deterministic capability dependencies needing human review in the fictional Harbour scenario.", inputSchema: emptySchema, execute: async () => report("Agent checked single points of failure", findSinglePointsOfFailure()) });
      await context.registerTool({ name: "compare_support_scenario", description: "Compare the current fictional result with a time-bounded shared-support assumption. This is analysis only and never transfers or allocates a resource.", inputSchema: emptySchema, execute: async () => report("Agent compared the shared-support scenario", compareSupportScenario()) });
      await context.registerTool({ name: "find_minimum_interventions", description: "Find ranked, human-approved interventions for the canonical plan.", inputSchema: emptySchema, execute: async () => report("Agent searched minimum interventions", findMinimumInterventions()) });
      await context.registerTool({ name: "find_neighbour_support", description: "Find shareable local support; excludes offline options and anything that would breach supplying-station readiness.", inputSchema: emptySchema, execute: async () => report("Agent searched local support", findNeighbourSupport()) });
      await context.registerTool({ name: "draft_support_request", description: "Create a visible draft only; it never transfers a resource.", inputSchema: { type: "object", properties: { resource_id: { type: "string" } }, required: ["resource_id"] }, execute: async (input) => report(`Agent drafted support request for ${String(input.resource_id)}`, { status: "DRAFT", resourceId: input.resource_id, humanApprovalRequired: true }) });
      await context.registerTool({ name: "approve_support_request", description: "Approve an existing draft only when explicit human confirmation is true.", inputSchema: { type: "object", properties: { explicit_human_confirmation: { type: "boolean" } }, required: ["explicit_human_confirmation"] }, execute: async (input) => input.explicit_human_confirmation === true ? report("Human-approved request recorded", { status: "APPROVED" }) : { status: "BLOCKED", reason: "Explicit human confirmation is required." } });
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
  return <div className={`status ${enabled ? "" : "muted"}`} aria-live="polite"><p><span /> {enabled ? "Browser tools registered" : "Browser-tool connection pending"}</p><small>{lastAction}</small>{lastResult && <small>{lastResult}</small>}</div>;
}
