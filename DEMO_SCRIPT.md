# Emergency Mesh — Competition Demo Guide

## Submission links

- Live app: `https://emergency-mesh.vercel.app`
- Source: `https://github.com/MysonGee/emergency-mesh`
- Licence: Apache-2.0

Use Production for judges because it is public. The stable Preview is protected and is not the competition URL.

## Core story

Emergency Mesh combines fictional source evidence from availability, currency, assets, maintenance and safety systems into a deterministic capability view. It explains the binding constraint and lets a browser agent help inspect evidence or prepare a reviewable draft—without dispatching, allocating or approving anything.

## Suggested walkthrough

1. **Operational readiness** — point out that the readiness index is calculated from declared member availability, vehicles online and equipment online. Show the data-sourced current posture and impact.
2. **Data & settings / People & assets** — add or amend a fictional asset using the controlled status dropdown. Choose Offline and optionally set a return date. Show that the change appears in People & assets. Explain that the edit is isolated to this browser and does not write to Supabase.
3. **Preparedness / Capability scenarios / Operational overview** — show the same browser-local asset state flowing through evidence, scenario choices, readiness counts, capability constraints, offline-issue detail and expected return. The deterministic result changes, but no operational or upstream action occurs.
4. **Operational overview map** — show attributed OSM Asset locations and separate assets/deployed/maintenance/incident context. State clearly: fictional locations, no live tracking, routing or control.
5. **Local support** — show Harbour is assessed first. Only after a Station gap can aggregate local support be considered. A human owns approval.
6. **WebMCP proof (highest value)** — in ChatGPT’s in-app browser, ask for available tools; then ask for 30-day safety evidence or a support-request draft. Show the visible Local support draft and the human-review boundary.

The live Production build has already been verified to expose 13 WebMCP tools. `get_people_and_asset_evidence` also reflects browser-local asset overrides.

## Video decision

The official requirement is a public video with audio, under three minutes, demonstrating the working app and explaining WebMCP. If the submitted video cannot be updated safely, retain it and ensure the live app/source links and description are strong. If it can be edited before the deadline, add a brief WebMCP proof clip rather than rebuilding the whole video.

Never describe the product as dispatch, operational command, live tracking, routing or autonomous approval.
