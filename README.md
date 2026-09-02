# Emergency Mesh

Emergency Mesh is a fictional, deterministic capability-intelligence prototype for the OpenAI WebMCP Challenge 2026. It brings source evidence together to show a station’s readiness, test a planning scenario, identify a Station gap and prepare a human-approved support option.

Licensed under [Apache-2.0](LICENSE).

It is not CAD, dispatch, tasking, rostering, an LMS, asset management, live tracking, routing or tactical command. All locations, people, assets, incidents, policies and thresholds are fictional.

Read [PROJECT_STATUS.md](PROJECT_STATUS.md) for the current state, [PRODUCT_BOUNDARY.md](PRODUCT_BOUNDARY.md) for non-negotiable scope, [UX_UI_STANDARDS.md](UX_UI_STANDARDS.md) for design expectations and [HANDOVER.md](HANDOVER.md) to continue work safely.

## What is implemented

- **Operational readiness:** a calculated dashboard of member availability, vehicle/equipment source status, compliance and capability impact. Its readiness profile is data-driven.
- **People & assets:** all Harbour members plus full fleet/equipment filters and asset drill-down, based on fictional source records.
- **Preparedness and Safety & compliance:** plan, maintenance, inspection, expiry and renewal evidence. It surfaces what is due and when; it does not manage the upstream systems.
- **Capability scenarios:** manual planning-only status changes and AI-assisted analysis. Scenario completion moves to Operational overview by user choice.
- **Operational overview:** deterministic capability outcome, a 12/24/36/48/72-hour forecast from declared availability and source asset return times, asset details, scenario reset and a Sydney OSM **Asset locations** map. Map assets/incidents are fictional source context, not live tracking.
- **Local support and Requests & approvals:** Harbour is assessed first, then aggregate support may appear only after a gap. A supplying station retains ownership/minimum readiness and a human approves requests.
- **Data & settings and Activity:** fictional data feeds, persisted source corrections and audit view through Supabase.
- **Genuine WebMCP:** browser tool registration remains in the app. The optional server-side AI review is an additional, read-only demonstration and does not replace WebMCP.

## Data and source boundary

Emergency Mesh consumes or simulates membership/availability, training currency, asset register, fleet, maintenance, safety/compliance and operational-management evidence. The normalized read adapter feeds readiness, capability calculation, overview, map, fleet, asset detail and source views from the same evidence snapshot. Asset issue evidence includes a fictional reported offline time, planned return and reason; it is not live tracking. These upstream systems remain authoritative. Emergency Mesh may save a fictional demonstration correction/audit record, but does not become their administration or source-of-truth system.

Weather/BOM data is awareness only. It can prompt **Review capability**; it cannot activate members, create work, dispatch, deploy or initiate operations.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) if using Supabase/authentication.
3. Add `OPENAI_API_KEY` only for the optional live server-side review. Never prefix it `NEXT_PUBLIC_`.
4. In Supabase SQL Editor, apply migrations in `supabase/migrations/` in filename order, including `202609020001_asset_issue_evidence_and_horizon_demo.sql`, then apply the seed files in `supabase/seed/` in their documented order.
5. Install and run:

   ```powershell
   npm install
   npm run dev
   ```

## Validation and Preview deployment

```powershell
npm.cmd run typecheck
npm.cmd run build
$env:NODE_OPTIONS='--use-system-ca'; npx.cmd vercel deploy --yes
npx.cmd vercel alias set <deployment-url> emergency-mesh-preview-mysongees-projects.vercel.app
```

Use the stable Preview link: `https://emergency-mesh-preview-mysongees-projects.vercel.app`.

Do not deploy Production without explicit approval. Preview is deployment-protected; signed-in testing is required for the authenticated workspace.

## Demo

Use [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the walkthrough. The key message is: Emergency Mesh shows capability intelligence from source evidence and preserves human control; it does not control operations.

## WebMCP

Open the app in ChatGPT's in-app browser to expose its page-defined WebMCP tools. They provide deterministic, read-only capability evidence, planning-only simulations, dependency checks and donor-safe support comparisons. The optional server AI review is separate: it summarizes the same deterministic evidence via the server-only `OPENAI_API_KEY` and cannot mutate source systems or initiate operations.

For the competition submission, use a working live URL that judges can access. If deployment protection remains enabled, provide valid test access instructions on the submission form.
