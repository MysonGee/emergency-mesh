# Emergency Mesh

Emergency Mesh is a fictional, deterministic capability-intelligence prototype for the OpenAI WebMCP Challenge 2026. It combines source evidence to show a station’s readiness, test a planning scenario, identify a Station gap and prepare a human-reviewed support-request draft.

**Live app:** `https://emergency-mesh.vercel.app`

**Source:** `https://github.com/MysonGee/emergency-mesh`

**Licence:** [Apache-2.0](LICENSE)

It is not CAD, dispatch, tasking, rostering, an LMS, asset management, live tracking, routing or tactical command. All people, locations, assets, incidents, policies and thresholds are fictional.

## What it demonstrates

- Data-derived operational readiness from declared member availability, vehicle status and equipment status.
- Evidence-led people/assets, preparedness, safety/compliance and asset issue views.
- Deterministic planning outcomes, availability horizons, constraint explanation and a non-live, attributed OSM context map.
- Harbour-first local support: aggregate donor-safe options appear only after a Station gap, and every request stays a human-reviewed draft.
- Genuine WebMCP tools registered by the page with `document.modelContext.registerTool()`.
- Optional server-side AI-assisted review using a server-only OpenAI key and four deterministic read tools. It supplements, never replaces, the browser WebMCP path.
- Public judge access with no sign-in requirement. Supabase source evidence is read-only; demonstration amendments are validated, isolated to the current browser and never written back to Supabase.
- Controlled asset amendments use Available, Deployed, Offline or Maintenance plus an optional offline-until date. Browser-local asset overrides flow through people/assets, readiness, preparedness, scenarios, overview, asset detail, relevant support logic and WebMCP evidence/calculations.

## WebMCP collaboration

Open the live app in ChatGPT’s in-app browser and ask what tools are available. The page exposes deterministic evidence, planning and support-draft tools. A browser agent can read readiness and safety evidence, assess a planning scenario, identify constraints and prepare a visible Local support draft for human review.

It cannot dispatch, activate, allocate, transfer, approve, submit, route, track or change upstream source records. Deterministic evidence is the authority; an authorised human makes consequential decisions.

## Judge-safe data amendments

The competition build is public and has no authentication flow. To avoid exposing anonymous database writes, **Data & settings** reads Supabase source tables but saves demonstration amendments to bounded, validated browser storage. Changes are visible only in that browser and cannot affect another judge or the shared database. Asset changes are normalised into the deterministic client model so relevant views and WebMCP tools remain consistent. Refreshing preserves them in the same browser; clearing site data resets them.

Asset record controls are constrained to four statuses: Available, Deployed, Offline and Maintenance. Offline may include an optional return date. Text fields are required, trimmed, length-limited and rendered through React escaping; local rows are capped at 150 per source.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` to `https://jbmpkhsmhumqopfkeooz.supabase.co` and set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Supabase-backed source evidence. Do not include the variable name inside its value.
3. Set `OPENAI_API_KEY` only to enable the optional server review; never expose it through `NEXT_PUBLIC_*`.
4. Apply `supabase/migrations/` and seed files in filename order if creating a fresh database.
5. Install and run:

   ```powershell
   npm install
   npm run dev
   ```

Only these application variables are required in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY` (optional AI review only)

## Validate and deploy

```powershell
npm.cmd run typecheck
npm.cmd run build
$env:NODE_OPTIONS='--use-system-ca'; npx.cmd vercel deploy --yes
npx.cmd vercel alias set <deployment-url> emergency-mesh-preview-mysongees-projects.vercel.app
```

Stable protected Preview: `https://emergency-mesh-preview-mysongees-projects.vercel.app`.

Production deployment:

```powershell
$env:NODE_OPTIONS='--use-system-ca'; npx.cmd vercel deploy --prod --yes
```

OSM is attributed in-app; for a commercial deployment, replace public OSM tiles with an appropriate commercial or self-hosted provider.
