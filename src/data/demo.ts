import type { Asset, Member, Unit } from "@/domain/types";

const demoStart = "2026-08-27T18:00:00Z";
const demoEnd = "2026-08-28T06:00:00Z";
const availableFrom = "2026-08-27T00:00:00Z";
const availableUntil = "2026-08-30T18:00:00Z";

export const units: Unit[] = [
  { id: "harbour", name: "Unit Harbour", minimumReadiness: 1, neighbouringUnitIds: ["ridge", "valley"] },
  { id: "ridge", name: "Unit Ridge", minimumReadiness: 1, neighbouringUnitIds: ["harbour", "valley"] },
  { id: "valley", name: "Unit Valley", minimumReadiness: 1, neighbouringUnitIds: ["harbour", "ridge"] },
];

export const sourceLocations = [
  { id: "harbour", label: "Harbour Station", coordinates: "-33.91, 151.16", bbox: "151.12%2C-33.94%2C151.20%2C-33.88" },
  { id: "ridge", label: "Ridge Station", coordinates: "-33.87, 151.22", bbox: "151.18%2C-33.90%2C151.26%2C-33.84" },
  { id: "district", label: "Harbour district context", coordinates: "-33.89, 151.19", bbox: "151.05%2C-33.98%2C151.28%2C-33.82" },
] as const;

function member(id: string, name: string, competencies: string[], activityHoursBeforeWindow = 0): Member {
  return { id, unitId: "harbour", name, competencies, licences: competencies.includes("SPECIALIST_DRIVER") ? ["SPECIALIST_VEHICLE"] : [], availableFrom, availableUntil, activityHoursBeforeWindow, maximumContinuousHours: 14, trainingCurrency: "CURRENT", trainingSummary: "Imported qualification record", experienceYears: 4 };
}

export const members: Member[] = [
  member("H01", "Morgan Lee", ["FLOOD_RESCUE"]), member("H02", "Taylor Finch", ["FLOOD_RESCUE"]),
  member("H03", "Casey Rowan", ["CHAINSAW"]), { ...member("H04", "Riley Santos", ["CHAINSAW"]), sourceStatus: "IN_USE" },
  member("H05", "Parker Quinn", ["STORM_RESPONSE"]), member("H06", "Drew Ellis", ["STORM_RESPONSE"]),
  member("H07", "Avery Cole", ["FLOOD_RESCUE", "CHAINSAW", "SPECIALIST_DRIVER"]), member("H08", "Jules Ray", ["SPECIALIST_DRIVER"], 4),
  member("H09", "Emery Blake", ["STORM_RESPONSE"]), member("H10", "Skyler Moss", ["STORM_RESPONSE"]), member("H11", "Alex Monroe", ["STORM_RESPONSE"]),
  member("H12", "Sage Hart", ["STORM_RESPONSE"]), member("H13", "Robin Hale", ["STORM_RESPONSE"]), member("H14", "Cameron Shore", ["STORM_RESPONSE"]),
  { id: "R01", unitId: "ridge", name: "Reese Lane", competencies: ["SPECIALIST_DRIVER"], licences: ["SPECIALIST_VEHICLE"], availableFrom, availableUntil, activityHoursBeforeWindow: 0, maximumContinuousHours: 14 },
  { id: "V04", unitId: "valley", name: "Jordan Vale", competencies: ["SPECIALIST_DRIVER"], licences: ["SPECIALIST_VEHICLE"], availableFrom, availableUntil, activityHoursBeforeWindow: 0, maximumContinuousHours: 14 },
];

const firstNames = ["Ainsley", "Bailey", "Blake", "Charlie", "Dakota", "Eden", "Flynn", "Greer", "Harper", "Indigo", "Jamie", "Kai", "Lennox", "Micah", "Noah", "Oakley", "Peyton", "Quinn", "Reese", "Shiloh", "Teagan", "Vale", "Wren", "Xavier", "Yasmin", "Zion", "Arden", "Briar", "Cleo", "Devon", "Ellis", "Frankie", "Gale", "Hollis", "Ira", "Jesse", "Keegan", "Lane", "Marley", "Nico", "Onyx", "Presley", "Remy"];
const surnames = ["Archer", "Bennett", "Carter", "Dawson", "Ellery", "Foster", "Grady", "Hughes", "Irving", "Jordan", "Keats", "Lennon", "Marlow", "North", "Orton", "Perry", "Quade", "Rivers", "Sutton", "Tanner", "Ulrich", "Vance", "Walsh", "York", "Zeller", "Ashby", "Brooks", "Cullen", "Denton", "Eames", "Farrow", "Gibson", "Huxley", "Ingram", "Jarvis", "Kendall", "Larkin", "Mercer", "Nolan", "Osborne", "Parker", "Quill", "Reeve"];
const generatedHarbourMembers: Member[] = Array.from({ length: 86 }, (_, offset) => {
  const index = offset + 15;
  const competencies = [
    index % 2 === 0 ? "STORM_RESPONSE" : "FLOOD_RESCUE",
    index % 3 === 0 ? "CHAINSAW" : "FIRST_AID",
    ...(index % 4 === 0 ? ["BOAT_OPERATOR"] : []),
    ...(index % 7 === 0 ? ["DRONE_OPERATOR"] : []),
    ...(index % 8 === 0 ? ["RADIO_OPERATOR"] : []),
    ...(index % 10 === 0 ? ["IMT"] : []),
    ...(index % 11 === 0 ? ["SPECIALIST_DRIVER"] : []),
    ...(index % 13 === 0 ? ["LOGISTICS"] : []),
  ];
  const trainingCurrency = index % 23 === 0 ? "LAPSED" : index % 9 === 0 ? "REVIEW_REQUIRED" : "CURRENT";
  const declaredUntil = index % 17 === 0 ? "2026-08-28T06:00:00Z" : index % 13 === 0 ? "2026-08-28T18:00:00Z" : index % 11 === 0 ? "2026-08-29T06:00:00Z" : index % 7 === 0 ? "2026-08-29T18:00:00Z" : availableUntil;
  return {
    id: `H${String(index).padStart(2, "0")}`,
    unitId: "harbour",
    name: `${firstNames[offset % firstNames.length]} ${surnames[offset % surnames.length]}`,
    competencies,
    licences: competencies.includes("SPECIALIST_DRIVER") ? ["SPECIALIST_VEHICLE"] : [],
    availableFrom,
    availableUntil: declaredUntil,
    activityHoursBeforeWindow: index % 19 === 0 ? 6 : 0,
    maximumContinuousHours: 14,
    sourceStatus: index % 29 === 0 ? "OFFLINE" : index % 17 === 0 ? "IN_USE" : "ONLINE",
    trainingCurrency,
    trainingSummary: trainingCurrency === "CURRENT" ? "Current source record" : trainingCurrency === "REVIEW_REQUIRED" ? "Currency review required" : "Currency lapsed in source record",
    experienceYears: 1 + (index % 18),
  };
});

members.splice(14, 0, ...generatedHarbourMembers);

export const assets: Asset[] = [
  { id: "H-S01", unitId: "harbour", name: "Harbour Specialist 01", type: "SPECIALIST_TRUCK", status: "OFFLINE_UNTIL", offlineSince: "2026-08-27T14:20:00Z", offlineUntil: "2026-09-05T00:00:00Z", offlineReason: "Drivetrain fault under workshop repair; replacement part is awaited.", capacity: "Specialist capability platform", sourceCondition: "REVIEW_REQUIRED" },
  { id: "H-ST01", unitId: "harbour", name: "Harbour Storm 01", type: "STORM_TRUCK", status: "AVAILABLE", capacity: "Light storm response · 3 people" },
  { id: "H-ST02", unitId: "harbour", name: "Harbour Storm 02", type: "STORM_TRUCK", status: "AVAILABLE", capacity: "Medium storm response · 5 people" },
  { id: "H-ST03", unitId: "harbour", name: "Harbour Storm 03", type: "STORM_TRUCK", status: "IN_USE", capacity: "Medium storm response · 5 people" },
  { id: "H-ST04", unitId: "harbour", name: "Harbour Storm 04", type: "STORM_TRUCK", status: "AVAILABLE", capacity: "Heavy storm response · 6 people" },
  { id: "H-ST05", unitId: "harbour", name: "Harbour Storm 05", type: "STORM_TRUCK", status: "OFFLINE_UNTIL", offlineSince: "2026-08-27T09:10:00Z", offlineUntil: "2026-08-29T18:00:00Z", offlineReason: "Brake inspection identified a hydraulic leak; workshop clearance is pending.", capacity: "Heavy storm response · 6 people", sourceCondition: "REVIEW_REQUIRED" },
  { id: "H-ST06", unitId: "harbour", name: "Harbour Storm 06", type: "STORM_TRUCK", status: "AVAILABLE", capacity: "Light storm response · 3 people" },
  { id: "H-RV01", unitId: "harbour", name: "Harbour Rescue 01", type: "RESCUE_VEHICLE", status: "AVAILABLE", capacity: "Rescue vehicle · 4 people" },
  { id: "H-RV02", unitId: "harbour", name: "Harbour Rescue 02", type: "RESCUE_VEHICLE", status: "AVAILABLE", capacity: "Rescue vehicle · 4 people" },
  { id: "H-RV03", unitId: "harbour", name: "Harbour Rescue 03", type: "RESCUE_VEHICLE", status: "IN_USE", capacity: "Rescue vehicle · 5 people" },
  { id: "H-RV04", unitId: "harbour", name: "Harbour Rescue 04", type: "RESCUE_VEHICLE", status: "AVAILABLE", capacity: "Rescue vehicle · 5 people" },
  { id: "H-RV05", unitId: "harbour", name: "Harbour Rescue 05", type: "RESCUE_VEHICLE", status: "AVAILABLE", capacity: "Rescue vehicle · 4 people" },
  { id: "H-FB01", unitId: "harbour", name: "Harbour RIB 01", type: "FLOOD_BOAT", status: "AVAILABLE", capacity: "Rigid inflatable boat · 4 people" },
  { id: "H-FB02", unitId: "harbour", name: "Harbour RIB 02", type: "FLOOD_BOAT", status: "AVAILABLE", capacity: "Rigid inflatable boat · 6 people" },
  { id: "H-FB03", unitId: "harbour", name: "Harbour Bow Loader 01", type: "FLOOD_BOAT", status: "AVAILABLE", capacity: "Bow-loader flood boat · 8 people" },
  { id: "H-FB04", unitId: "harbour", name: "Harbour Flat Bottom 01", type: "FLOOD_BOAT", status: "OFFLINE_UNTIL", offlineSince: "2026-08-27T11:45:00Z", offlineUntil: "2026-08-30T06:00:00Z", offlineReason: "Hull fitting inspection requires resealing and a water-test sign-off.", capacity: "Flat-bottom flood boat · 5 people", sourceCondition: "REVIEW_REQUIRED" },
  { id: "H-FB05", unitId: "harbour", name: "Harbour Rescue Craft 01", type: "FLOOD_BOAT", status: "AVAILABLE", capacity: "Shallow-water rescue craft · 3 people" },
  { id: "H-G01", unitId: "harbour", name: "Generator G01", type: "GENERATOR", status: "AVAILABLE", capacity: "20 kVA" },
  { id: "H-G02", unitId: "harbour", name: "Generator G02", type: "GENERATOR", status: "AVAILABLE", capacity: "40 kVA" },
  { id: "H-G03", unitId: "harbour", name: "Generator G03", type: "GENERATOR", status: "OFFLINE_UNTIL", offlineSince: "2026-08-27T16:05:00Z", offlineUntil: "2026-08-28T18:00:00Z", offlineReason: "Service-hours threshold reached; scheduled preventative service is in progress.", remainingUsageHours: 0, capacity: "10 kVA", sourceCondition: "REVIEW_REQUIRED" },
  { id: "H-FCV01", unitId: "harbour", name: "Harbour Forward Command 01", type: "FORWARD_COMMAND_VEHICLE", status: "AVAILABLE", capacity: "Forward command workspace · 4 staff" },
  { id: "H-DR01", unitId: "harbour", name: "Drone 01", type: "DRONE", status: "AVAILABLE", capacity: "Thermal imaging · 35 min endurance" },
  { id: "H-DR02", unitId: "harbour", name: "Drone 02", type: "DRONE", status: "AVAILABLE", capacity: "Visual mapping · 42 min endurance" },
  { id: "H-DR03", unitId: "harbour", name: "Drone 03", type: "DRONE", status: "IN_USE", capacity: "Thermal imaging · 28 min endurance" },
  { id: "H-RC01", unitId: "harbour", name: "Radio Cache 01", type: "RADIO_CACHE", status: "AVAILABLE", capacity: "24 handheld radios" },
  { id: "H-RC02", unitId: "harbour", name: "Radio Cache 02", type: "RADIO_CACHE", status: "AVAILABLE", capacity: "12 handheld radios" },
  { id: "H-GPV01", unitId: "harbour", name: "Harbour General Purpose 01", type: "GENERAL_PURPOSE_VEHICLE", status: "AVAILABLE", capacity: "General purpose · 5 people" },
  { id: "H-CU01", unitId: "harbour", name: "Harbour Commander Ute 01", type: "COMMANDER_UTE", status: "AVAILABLE", capacity: "Command support · 2 people" },
  { id: "H-GZ01", unitId: "harbour", name: "Gazebo 01", type: "GAZEBO", status: "AVAILABLE", capacity: "3 × 3 m shelter" },
  { id: "H-GZ02", unitId: "harbour", name: "Gazebo 02", type: "GAZEBO", status: "AVAILABLE", capacity: "3 × 3 m shelter" },
  { id: "H-GZ03", unitId: "harbour", name: "Gazebo 03", type: "GAZEBO", status: "AVAILABLE", capacity: "6 × 3 m shelter" },
  { id: "H-C01", unitId: "harbour", name: "Chainsaw C01", type: "CHAINSAW", status: "AVAILABLE", remainingUsageHours: 20, capacity: "Source maintenance horizon: 20 hours" },
  { id: "R02", unitId: "ridge", name: "Ridge Specialist 02", type: "SPECIALIST_TRUCK", status: "AVAILABLE" },
  { id: "R01", unitId: "ridge", name: "Ridge Specialist 01", type: "SPECIALIST_TRUCK", status: "AVAILABLE" },
  { id: "R03", unitId: "ridge", name: "Ridge Specialist 03", type: "SPECIALIST_TRUCK", status: "OFFLINE_UNTIL", offlineUntil: "2026-09-05T00:00:00Z" },
];

export const demoScenario = {
  startAt: demoStart,
  endAt: demoEnd,
  summary: "Can Harbour sustain Flood Rescue, Chainsaw, and Specialist Truck capabilities from 18:00 to 06:00 while keeping one Storm team in reserve?",
  units: [
    { id: "harbour", name: "Unit Harbour", role: "Home unit", note: "Hidden multi-skill overlap; truck offline; generator near service." },
    { id: "ridge", name: "Unit Ridge", role: "Neighbour", note: "Can lend R02 while retaining its configured minimum readiness." },
    { id: "valley", name: "Unit Valley", role: "Neighbour", note: "Has specialist cover but lower residual readiness." },
  ],
};
