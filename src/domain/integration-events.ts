export type IntegrationEvent = {
  id: string; source: "Operational response" | "Availability" | "Asset maintenance" | "Neighbour network";
  occurredAt: string; priority: "HIGH" | "MEDIUM" | "LOW"; title: string; impact: string;
};

export const demoIncident = {
  id: "INC-DEMO-014", source: "Operational response", priority: "HIGH",
  title: "Severe storm and flash flooding", receivedAt: "2026-08-27T17:42:00Z",
  requiredWindow: "18:00–06:00", demands: ["Flood Rescue ×1", "Chainsaw ×1", "Specialist truck crew ×1", "Storm reserve ×1"],
};

export const demoEvents: IntegrationEvent[] = [
  { id: "evt-1", source: "Operational response", priority: "HIGH", occurredAt: "17:42", title: "Incident requirement received", impact: "Scenario created from required capabilities." },
  { id: "evt-2", source: "Asset maintenance", priority: "HIGH", occurredAt: "17:48", title: "Harbour Specialist 01 offline", impact: "Specialist truck capability gap detected." },
  { id: "evt-3", source: "Neighbour network", priority: "MEDIUM", occurredAt: "17:50", title: "Ridge R02 shareable", impact: "Donor-safe support option available." },
];
