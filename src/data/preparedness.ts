export const preparednessSignals = [
  { id: "PMI-HS01", category: "Vehicle PMI", asset: "Harbour Specialist 01", due: "2026-08-29", status: "DUE_SOON", source: "Fleet maintenance", impact: "Specialist truck capability remains unavailable until source clearance." },
  { id: "REGO-HS02", category: "Annual registration", asset: "Harbour Support 02", due: "2026-07-31", status: "COMPLETE", source: "Fleet register", impact: "Annual registration recorded complete." },
  { id: "SLING-07", category: "Lifting sling inspection", asset: "Crane sling set 07", due: "2026-08-31", status: "DUE_SOON", source: "Inspection register", impact: "Lifting capability requires source inspection confirmation before use." },
  { id: "GEN-G03", category: "Generator service", asset: "Generator G03", due: "5.4 operating hours", status: "DUE_SOON", source: "Equipment maintenance", impact: "Service horizon affects sustained generator capability." },
  { id: "REGO-R02", category: "Annual registration", asset: "Ridge Specialist 02", due: "2026-07-28", status: "COMPLETE", source: "Fleet register", impact: "Current source evidence supports donor-safe option assessment." },
] as const;

/** Read-only maintenance evidence from the fictional upstream registers. */
export const maintenanceEvidence = [
  { id: "MAINT-HS01", asset: "Harbour Specialist 01", category: "Vehicle PMI", lastCompleted: "30 Jul 2026", cycle: "30 days", nextDue: "29 Aug 2026", status: "OVERDUE", impact: "Specialist truck remains offline pending source clearance." },
  { id: "MAINT-ST05", asset: "Harbour Storm 05", category: "Scheduled service", lastCompleted: "16 Feb 2026", cycle: "6 months", nextDue: "16 Aug 2026", status: "OVERDUE", impact: "Storm vehicle requires maintenance review before capability is relied on." },
  { id: "MAINT-FB04", asset: "Harbour Flood Boat 04", category: "Hull and safety check", lastCompleted: "31 Jul 2026", cycle: "30 days", nextDue: "31 Aug 2026", status: "DUE_SOON", impact: "Flood boat use needs current source inspection confirmation." },
  { id: "MAINT-G03", asset: "Generator G03", category: "Operating-hour service", lastCompleted: "12 Aug 2026", cycle: "100 operating hours", nextDue: "5.4 hours remaining", status: "DUE_SOON", impact: "Sustained generator capability reaches its service horizon soon." },
  { id: "MAINT-RV02", asset: "Harbour Rescue Vehicle 02", category: "Annual inspection", lastCompleted: "04 Sep 2025", cycle: "12 months", nextDue: "04 Sep 2026", status: "DUE_SOON", impact: "Vehicle remains online; inspection evidence is due shortly." },
] as const;

export const temporaryHostingRequests = [
  { id: "HOST-014", direction: "OUTGOING", asset: "Ridge Specialist 02", donor: "Station Ridge", requester: "Station Harbour", period: "01 Sep 08:00 – 07 Sep 18:00", reason: "Preparedness coverage while Harbour Specialist 01 remains under PMI", status: "REVIEWING", donorImpact: "Ridge retains 1 specialist vehicle against minimum readiness of 1." },
  { id: "HOST-009", direction: "OUTGOING", asset: "Valley Generator 04", donor: "Station Valley", requester: "Station Harbour", period: "18 Aug 08:00 – 25 Aug 18:00", reason: "Community-site preparedness exercise", status: "RETURNED", donorImpact: "Supplying-station ownership retained throughout the temporary hosting period." },
  { id: "HOST-021", direction: "INCOMING", asset: "Harbour Generator G02", donor: "Station Harbour", requester: "Station Valley", period: "03 Sep 08:00 – 05 Sep 18:00", reason: "Community recovery-site power coverage", status: "REVIEWING", donorImpact: "Harbour retains 1 generator against its minimum readiness of 1." },
] as const;

export const preparednessPlans = [
  { id: "PLAN-FLOOD", name: "Flood plan", owner: "Emergency management", reviewed: "18 Aug 2026", status: "CURRENT", readiness: "Current source record available for review." },
  { id: "PLAN-TSUNAMI", name: "Tsunami plan", owner: "Emergency management", reviewed: "11 Jul 2026", status: "REVIEW_REQUIRED", readiness: "Confirm local assumptions and currency before relying on this plan." },
  { id: "PLAN-EM", name: "Emergency management plan", owner: "Emergency management", reviewed: "03 Aug 2026", status: "CURRENT", readiness: "Current source record available for review." },
  { id: "PLAN-CI", name: "Commander’s intent", owner: "Operational management", reviewed: "27 Aug 2026", status: "REVIEW_REQUIRED", readiness: "Confirm current incident context before relying on this direction." },
] as const;

export const complianceEvidence = [
  { id: "COMP-OP-01", category: "Member capability renewal", item: "Flood boat operator capability", location: "Harbour members", due: "30 Aug 2026", cycle: "12-month renewal", status: "DUE_SOON", source: "Member training & currency database", reminder: "Annual renewal due in 2 days." },
  { id: "COMP-OP-02", category: "Member capability renewal", item: "Heavy vehicle operator capability", location: "Harbour members", due: "10 Sep 2026", cycle: "12-month renewal", status: "DUE_SOON", source: "Member training & currency database", reminder: "Annual renewal due in 13 days." },
  { id: "COMP-SMS-01", category: "Safety management", item: "Station and asset risk assessments", location: "Harbour Station", due: "15 Sep 2026", cycle: "12-month review", status: "DUE_SOON", source: "Safety management system", reminder: "Annual review due in 18 days." },
  { id: "COMP-CHEM-01", category: "Chemical management", item: "Chemical register and safety data sheets", location: "Harbour Station", due: "Current", cycle: "Quarterly review", status: "CURRENT", source: "Chemical management system", reminder: "Current source record received." },
  { id: "COMP-RACK-01", category: "Building safety", item: "Storage racking inspection", location: "Harbour Station", due: "05 Sep 2026", cycle: "12-month inspection", status: "DUE_SOON", source: "Safety management system", reminder: "Inspection due in 8 days." },
  { id: "COMP-FIRE-01", category: "Fire safety", item: "Building fire extinguishers", location: "Harbour Station", due: "07 Sep 2026", cycle: "6-month service", status: "DUE_SOON", source: "Fire safety register", reminder: "Service due in 10 days." },
  { id: "COMP-FIRE-02", category: "Fire safety", item: "Vehicle fire extinguishers", location: "Harbour fleet", due: "Current", cycle: "6-month service", status: "CURRENT", source: "Fleet management system", reminder: "Current source record received." },
  { id: "COMP-AED-01", category: "Medical safety", item: "AED pad and battery expiry", location: "Harbour Station", due: "01 Sep 2026", cycle: "Manufacturer expiry cycle", status: "DUE_SOON", source: "Medical equipment register", reminder: "Expiry review due in 4 days." },
  { id: "COMP-FA-01", category: "Consumables", item: "First-aid kit consumables", location: "Harbour fleet", due: "03 Sep 2026", cycle: "Monthly expiry check", status: "DUE_SOON", source: "Safety management system", reminder: "Expiry review due in 6 days." },
] as const;
