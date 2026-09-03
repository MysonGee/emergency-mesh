# Emergency Mesh Product Boundary

## Purpose

Emergency Mesh is a fictional capability-intelligence and readiness layer. It combines structured evidence from existing systems to show readiness, test a proposed operating condition, identify a Station gap and prepare a human-reviewed support-request draft.

It is not an operational-management, incident-management or computer-aided dispatch system.

## System boundary

```text
Operational / incident systems → capability requirement and broad context
Availability, currency, asset, maintenance, safety and history systems → source evidence
Weather sources → awareness signal and review prompt only
Emergency Mesh → deterministic feasibility, constraints, evidence and draft support options
Authorised human → decides whether to approve or act
Operational / incident systems → dispatch, tasking, deployment and field control
```

Source systems remain authoritative. The public competition build does not write corrections to Supabase: fictional demonstration amendments are validated and stored only in the current browser. They may influence the browser's readiness and planning calculations, but never administer upstream people, training, asset or maintenance systems.

## Emergency Mesh does

- normalise or simulate availability, currency, asset, maintenance, safety and operational evidence
- calculate sustainable capability, binding constraints, availability horizons and donor-safe support options
- show source, freshness, assumptions and time-qualified historical reference prompts
- consume weather as an attributed prompt to **Review capability** only
- assess Harbour first, then reveal aggregate local support only after a Station gap
- prepare a time-bounded support-request draft while preserving supplying-station ownership/minimum readiness
- expose deterministic evidence and planning assistance through genuine WebMCP tools
- apply clearly bounded browser-local demonstration overrides consistently across relevant views and WebMCP calculations

## Emergency Mesh never does

- dispatch, activate, task, deploy, route or issue tactical directions
- track live field locations or present map points as live positions
- assign members/assets to an active incident or automatically transfer resources
- maintain rosters, training courses, qualifications, maintenance work orders or asset records as source of truth
- certify compliance, infer fatigue/rest, or treat history as current operational instruction
- allow an agent to approve, submit, transfer, allocate or mutate upstream/shared source data

## WebMCP and agent boundary

Page-defined WebMCP tools are registered with `document.modelContext.registerTool()` and return deterministic fictional evidence, including browser-local asset overrides for that judge's session. They can read readiness, people/asset evidence, preparedness/safety evidence, evaluate a planning scenario, identify dependencies, compare donor-safe support and prepare a **visible draft** for human review.

The browser agent may open the relevant review screen or Local support draft. It cannot send the request, approve it, allocate a resource or initiate operations. The optional server-side AI review is separate, uses a server-only key and four deterministic read tools only; it supplements WebMCP and is never capability authority.

## Language and map rules

Use `operational readiness`, `capability outcome`, `capability impact`, `support option`, `draft request`, `review required` and `Deployed` (reported source status only). Avoid `dispatch`, `task`, `send crew` and `operational order`.

Asset locations and operational incidents are fictional source evidence on an attributed OSM base map. They provide geographic context only: no tracking, routing, dispatch or tactical control.

## Scope check

Before adding a feature ask: does it improve cross-system evidence, capability awareness, gap analysis, provenance or human-reviewed support? If not, it belongs elsewhere.
