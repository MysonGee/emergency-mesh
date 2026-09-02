import { NextResponse } from "next/server";
import { evaluateMainDemo, findNeighbourSupport, findSinglePointsOfFailure } from "@/domain/network";
import { loadLiveReadiness } from "@/lib/live-readiness";

export const runtime = "nodejs";

const tools = [
  { type: "function", name: "get_unit_readiness", description: "Get the fictional Harbour Station deterministic readiness result.", parameters: { type: "object", properties: {}, additionalProperties: false }, strict: true },
  { type: "function", name: "evaluate_capability_plan", description: "Assess the canonical fictional Harbour capability requirement in priority order.", parameters: { type: "object", properties: {}, additionalProperties: false }, strict: true },
  { type: "function", name: "find_single_points_of_failure", description: "Identify deterministic Harbour capability dependencies that require human review.", parameters: { type: "object", properties: {}, additionalProperties: false }, strict: true },
  { type: "function", name: "find_local_cluster_support", description: "Find aggregate local-support options that preserve supplying-station readiness after a station gap.", parameters: { type: "object", properties: {}, additionalProperties: false }, strict: true },
] as const;

const toolHandlers: Record<string, () => Promise<unknown>> = {
  get_unit_readiness: async () => {
    try { return (await loadLiveReadiness()).result; } catch { return evaluateMainDemo(); }
  },
  evaluate_capability_plan: async () => {
    try { return (await loadLiveReadiness()).result; } catch { return evaluateMainDemo(); }
  },
  find_single_points_of_failure: async () => findSinglePointsOfFailure(),
  find_local_cluster_support: async () => findNeighbourSupport(),
};

type ResponseItem = { type: string; name?: string; call_id?: string; arguments?: string; content?: Array<{ type?: string; text?: string }> };
type OpenAiResponse = { id: string; output?: ResponseItem[]; output_text?: string };

function responseText(response: OpenAiResponse) {
  return response.output_text || response.output?.flatMap((item) => item.content ?? []).filter((content) => content.type === "output_text").map((content) => content.text ?? "").join("\n").trim() || "";
}

function describeResult(tool: string, value: unknown) {
  if (tool === "evaluate_capability_plan") {
    const result = value as { feasible: boolean; bindingConstraints: Array<{ message: string }> };
    return result.feasible ? "Current evidence supports all capability requirements in the 18:00–06:00 planning period." : `Station gap identified: ${result.bindingConstraints[0]?.message ?? "A capability constraint requires review."}`;
  }
  if (tool === "get_unit_readiness") return "Current Harbour readiness evidence was retrieved for the deterministic review.";
  if (tool === "find_single_points_of_failure") {
    const findings = value as Array<{ resourceName: string }>;
    return `${findings.length} dependencies requiring human review: ${findings.map((finding) => finding.resourceName).join(", ")}.`;
  }
  if (tool === "find_local_cluster_support") {
    const options = value as Array<{ resourceName: string; supplyingUnitName: string }>;
    return options.length ? `${options.length} shareable local-support options found, including ${options[0].resourceName} from ${options[0].supplyingUnitName.replace("Unit ", "")} Station.` : "No shareable local-support option was found.";
  }
  return "Deterministic tool result returned.";
}

async function callOpenAI(body: Record<string, unknown>) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.json() as Promise<OpenAiResponse>;
}

export async function POST() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "The live agent is not configured. Add OPENAI_API_KEY to this Vercel environment." }, { status: 503 });
  }
  try {
    const system = "You are the Emergency Mesh review agent. This is a fictional capability-intelligence demo. Use the supplied tools to inspect readiness, assess the plan, identify a gap and, only if there is a station gap, inspect local support. The stated planning period is 18:00–06:00. Assess flood rescue, chainsaw, specialist truck and storm reserve using declared member availability/currency, asset status and maintenance evidence. Never claim to dispatch, deploy, activate volunteers, change a source system, direct field activity or approve a request. Write exactly four short factual bullet points: capability result, evidence cause, local support option, next human review. Do not use the terms feasible, feasibility, requested window or overall status. No headings, markdown emphasis or filler.";
    let response = await callOpenAI({ model: "gpt-5.6-luna", input: [{ role: "system", content: system }, { role: "user", content: "Run the Harbour capability review now. State what the planning scenario can and cannot cover, the evidence impact and the next review step." }], tools, max_output_tokens: 500 });
    const trace: Array<{ tool: string; result: string }> = [];
    for (let turn = 0; turn < 4; turn += 1) {
      const calls = (response.output ?? []).filter((item) => item.type === "function_call" && item.name && item.call_id);
      if (calls.length === 0) break;
      const outputs = await Promise.all(calls.map(async (call) => {
        const handler = toolHandlers[call.name!];
        const result = handler ? await handler() : { error: "Tool not allowed" };
        trace.push({ tool: call.name!, result: describeResult(call.name!, result) });
        return { type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) };
      }));
      response = await callOpenAI({ model: "gpt-5.6-luna", previous_response_id: response.id, input: outputs, tools, max_output_tokens: 500 });
    }
    let summary = responseText(response);
    if (!summary) {
      const finalResponse = await callOpenAI({ model: "gpt-5.6-luna", previous_response_id: response.id, input: [{ role: "user", content: "Give exactly four short factual bullet points: capability result, evidence cause, shareable local support option, next human review. Do not use feasible, feasibility, requested window or overall status. Do not call further tools." }], tool_choice: "none", max_output_tokens: 220 });
      summary = responseText(finalResponse);
    }
    const findings = summary.split(/\n|(?<=\.)\s+(?=[A-Z])/).map((item) => item.replace(/^[-•*]\s*/, "").replace(/not feasible/gi, "not available").replace(/feasibility/gi, "capability coverage").replace(/feasible/gi, "available").replace(/requested window/gi, "18:00–06:00 planning period").replace(/overall status:/gi, "Capability result:").trim()).filter(Boolean).slice(0, 4);
    return NextResponse.json({ summary, findings: findings.length ? findings : ["Station gap identified.", "Harbour Specialist 01 is unavailable in source evidence.", "Shared local support requires review.", "A person must approve any request."], trace, model: "gpt-5.6-luna" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The live agent could not complete the review." }, { status: 502 });
  }
}
