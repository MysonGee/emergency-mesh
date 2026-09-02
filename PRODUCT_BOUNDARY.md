# Emergency Mesh Product Boundary

## Purpose

Emergency Mesh is an agent-native capability-intelligence and readiness layer. It connects structured signals from existing systems to show current readiness, test a proposed operating condition, identify gaps, and prepare human-approved support options.

It is not an operational management system, incident-management system, or computer-aided dispatch system.

## Value proposition

The source systems can each answer a narrow question: who is trained, which qualifications are current, what assets exist, what is under maintenance, or what an incident requires. Emergency Mesh combines those changing signals to answer the cross-system question:

> Given this requirement and period, what capability can be offered and sustained, what is at risk, and what is the smallest human-approved resolution?

Training, qualification/currency, asset, availability, maintenance, historical incident and operational-response systems remain the source of truth. Emergency Mesh does not replace their workflows.

## System boundary

```text
Operational response / incident-management system
  → incident capability requirement, priority, timing, broad context

Availability, qualification, asset, maintenance, loan and historical-incident systems
  → current resource state, changes, provenance and currency

Weather warning sources
  → external awareness signal and review prompt only

Emergency Mesh
  → deterministic capability feasibility, gaps, impact, donor-safe options,
    historical reference prompts and draft support requests

Authorised human
  → approves or declines support offers/requests

Operational response / incident-management system
  → dispatch, tasking, deployment, incident action and live field control
```

## Emergency Mesh must do

- ingest or simulate configurable data from other systems
- consume weather warnings as an attributed external awareness source that can prompt a capability review
- consume training/currency status as evidence, without becoming an LMS or training register
- normalise changing resource, asset, availability and maintenance signals
- assess source-system maintenance, inspection, registration and service-horizon evidence for its capability impact, without becoming the maintenance system
- translate an incoming operational requirement into capability demands
- calculate sustainable capability and binding constraints
- expose source, freshness, assumptions and data currency
- identify the smallest safe capability resolution
- identify resilience and training-currency gaps when they affect a requested capability
- evaluate neighbour support without breaching donor readiness
- surface relevant, time-qualified prior-incident lessons as advisory prompts
- prepare drafts and preserve human approval for consequential actions
- prepare a time-bounded, supplying-station-owned temporary support request for a vehicle, equipment item or capability bundle; retain supplying-station ownership and never direct movement or use
- expose these specialist operations through WebMCP tools
- allow a server-side agent to select from an explicitly allow-listed set of deterministic analysis tools, while exposing the tool trace and result to a human

## Emergency Mesh must not do

- dispatch, task or deploy personnel
- automatically initiate operational activity, activate volunteers, dispatch resources, or create incident tasks from a weather warning
- assign operators or vehicles to an active incident
- issue tactical directions, routes or site placements
- manage live field operations or incident action plans
- create maintenance work orders, certify inspections, update registrations, or become the source of truth for service records
- manage training courses, assessments or qualification records as the source of truth
- assert that historical flood extent or past tactics remain current
- automatically transfer people, vehicles or equipment
- infer broad fatigue/rest evidence for volunteers
- expose model/API keys or make a model the authority for capability feasibility; deterministic source-evidence calculations remain authoritative

## Language rules

Use: `operational readiness`, `capability outcome`, `capability impact`, `support option`, `availability`, `draft request`, `approved support`, `reference prompt`, `review required`, `deployed`.

Avoid imperatives such as: `dispatch`, `task`, `assign to incident`, `send crew`, `operational order`. `Deployed` is permitted only as a reported source status, not as an instruction.

Prefer: `trained`, `current`, `currency review required`, `capability offer`, `gap`, `resolution option`, `source-system data`.

## Everyday readiness and PPRR

Emergency Mesh provides daily capability intelligence across prevention/mitigation, preparedness, response and recovery. `Operational readiness` is the everyday view; `Operational overview` presents the live or scenario-specific outcome. Maintenance, inspection, currency, availability, community-site and supplying-station-readiness signals can inform preparedness and recovery-capability reviews. Emergency Mesh does not replace preventative-maintenance, asset, roster, incident or recovery-case systems.

## Weather-source pattern

Weather is an awareness input, not an operational trigger. A warning update may show `Review capability`; a human or browser agent must explicitly open the scenario before Emergency Mesh calculates an offer or surfaces support options. The operational management/CAD system remains responsible for incident control, dispatch and any field activity.

## Map and location pattern

An Asset locations map may show source-record locations for home-station assets, fictional deployed/maintenance examples and fictional operational incidents. It is geographic context only. It must carry clear non-live wording and OSM attribution where OSM tiles are used. It must not imply live tracking, routing, field location awareness, dispatch or tactical control.

## Agent pattern

WebMCP browser tools and an optional server-side review agent may query the same deterministic domain functions. The agent may inspect readiness, assess a plan, identify dependencies and compare aggregate donor-safe options. Any tool allow-list must exclude dispatch, activation, tasking, source mutation, transfer, routing and approval. The UI must show the agent’s tool trace, clearly identify the deterministic evidence result, and state that human review/approval remains required.

The competition replay uses clearly labelled fictional weather data and resets to a known state. Optional live Bureau of Meteorology (BOM) data is not required for the demo. It must display warning type, area, issued/updated time, freshness, source attribution and a direct official-source link. If there is no relevant warning, show `No relevant warning received — no capability review triggered.` Do not use BOM branding as Emergency Mesh branding; follow the source feed's terms and attribution requirements.

## Historical information

Historical incident data is advisory only. Each reference must show source, date, age, currency, development/change warning, and current checks required. Current operational systems and authorised humans determine how, or whether, it is used.

## Scope check

Before adding a feature, ask:

> Does this improve cross-system capability awareness, gap analysis, resolution options, provenance, or human-approved support?

If not, it probably belongs in an operational management, CAD, asset, training, or communications system instead.
