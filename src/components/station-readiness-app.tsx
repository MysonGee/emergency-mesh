"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { assets, demoScenario, members, sourceLocations } from "@/data/demo";
import { complianceEvidence, maintenanceEvidence, preparednessPlans, preparednessSignals, temporaryHostingRequests } from "@/data/preparedness";
import { evaluateMainDemo, evaluateMainDemoWithAssets, evaluateMainDemoWithEvidence, findNeighbourSupport } from "@/domain/network";
import type { Asset, Member } from "@/domain/types";
import { demoWeatherSignal, type WeatherSignal } from "@/domain/weather";
import { WebMcpBridge } from "@/webmcp/webmcp-bridge";

type View = "readiness" | "evidence" | "scenarios" | "preparedness" | "compliance" | "overview" | "asset" | "support" | "agent" | "sources" | "activity";
type EvidenceFocus = "members" | "assets";
type Tone = "ready" | "review" | "gap" | "neutral" | "in-use";
type PlanningStatus = "AVAILABLE" | "OFFLINE_UNTIL" | "MAINTENANCE_DUE" | "IN_USE";
type PlanningChange = { assetId: string; status: PlanningStatus };
type ScenarioSnapshot = { summary: string; changes: PlanningChange[] };
type SourceRecord = { key: string; record: string; evidence: string; status: string };
type IconName = "readiness" | "people" | "fleet" | "safety" | "scenario" | "overview" | "support" | "requests" | "ai" | "data" | "activity";
const nav: Array<{ id: View; label: string; number: string; icon: IconName }> = [
  { id: "readiness", label: "Operational readiness", number: "01", icon: "readiness" }, { id: "evidence", label: "People & assets", number: "02", icon: "people" },
  { id: "preparedness", label: "Preparedness", number: "03", icon: "fleet" }, { id: "compliance", label: "Safety & compliance", number: "04", icon: "safety" },
  { id: "scenarios", label: "Capability scenarios", number: "05", icon: "scenario" }, { id: "overview", label: "Operational overview", number: "06", icon: "overview" },
  { id: "support", label: "Local support", number: "07", icon: "support" },
  { id: "sources", label: "Data & settings", number: "08", icon: "data" }, { id: "activity", label: "Activity", number: "09", icon: "activity" },
];
const capabilityNames: Record<string, string> = { FLOOD_RESCUE: "Flood rescue", CHAINSAW: "Chainsaw", SPECIALIST_DRIVER: "Specialist driver", STORM_RESPONSE: "Storm response", BOAT_OPERATOR: "Boat operator", DRONE_OPERATOR: "Drone operator", RADIO_OPERATOR: "Radio operator", IMT: "Incident management", LOGISTICS: "Logistics", FIRST_AID: "First aid" };
const assetNames: Record<string, string> = { SPECIALIST_TRUCK: "Specialist truck", STORM_TRUCK: "Storm truck", RESCUE_VEHICLE: "Rescue vehicle", FLOOD_BOAT: "Flood boat", GENERATOR: "Generator", CHAINSAW: "Chainsaw", FORWARD_COMMAND_VEHICLE: "Forward command", DRONE: "Drone", RADIO_CACHE: "Radio cache", GENERAL_PURPOSE_VEHICLE: "General-purpose vehicle", COMMANDER_UTE: "Commander vehicle", GAZEBO: "Gazebo" };
function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) { return <span className={`em-badge em-${tone}`}>{children}</span>; }
function Icon({ name, label }: { name: IconName; label?: string }) { const paths: Record<IconName, React.ReactNode> = { people: <><circle cx="9" cy="8" r="3" /><circle cx="16" cy="9" r="2.5" /><path d="M3.5 20c.5-4 3-6 5.5-6s5 2 5.5 6M14 15c3 0 5 1.7 5.5 4.5" /></>, fleet: <><path d="M3 7h11v9H3zM14 10h3l3 3v3h-6z" /><circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></>, safety: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 7v10M7 12h10" /></>, readiness: <><path d="M4 16a8 8 0 1 1 16 0" /><path d="m12 12 4-4" /><circle cx="12" cy="12" r="1" /></>, scenario: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="m7.5 7.5 3 8M16.5 7.5l-3 8M8 6h8" /></>, overview: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>, support: <><path d="M8 12h8M12 8l4 4-4 4" /><path d="M4 5h5v4H4zM15 15h5v4h-5z" /></>, requests: <><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></>, ai: <><rect x="5" y="5" width="14" height="14" rx="4" /><path d="M9 12h.01M15 12h.01M9 16c2 1 4 1 6 0" /></>, data: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" /></>, activity: <><path d="M3 12h4l2-5 4 10 2-5h6" /></> }; return <svg className="em-icon" viewBox="0 0 24 24" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>; }
function Info({ label, children }: { label: string; children: string }) { return <button className="em-info" type="button" aria-label={`About ${label}`} title={children}>i</button>; }
function SectionTitle({ title, info, action }: { title: string; info?: string; action?: React.ReactNode }) { return <div className="em-section-title"><div><h2>{title}{info && <Info label={title}>{info}</Info>}</h2></div>{action}</div>; }
function useSourceRecords(source: string) {
  const [records, setRecords] = useState<SourceRecord[] | null>(null);
  useEffect(() => {
    let active = true;
    void fetch(`/api/data/source-records?source=${source}`)
      .then((response) => response.json())
      .then((payload: { mode?: string; records?: SourceRecord[] }) => {
        if (active && payload.mode === "supabase") setRecords(payload.records ?? []);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [source]);
  return records;
}
function memberState(member: Member) { return member.trainingCurrency === "LAPSED" ? "Currency lapsed" : member.trainingCurrency === "REVIEW_REQUIRED" ? "Currency review" : member.sourceStatus === "OFFLINE" ? "Unavailable" : member.sourceStatus === "IN_USE" ? "In use" : "Available"; }
function memberTone(member: Member): Tone { return memberState(member) === "Available" ? "ready" : memberState(member) === "In use" ? "in-use" : memberState(member).includes("lapsed") || memberState(member) === "Unavailable" ? "gap" : "review"; }
function assetState(asset: Asset) { return asset.status === "AVAILABLE" ? "Available" : asset.status === "IN_USE" ? "Deployed" : asset.status === "OFFLINE_UNTIL" ? "Unavailable" : "Review required"; }
function assetTone(asset: Asset): Tone { return asset.status === "AVAILABLE" ? "ready" : asset.status === "IN_USE" ? "in-use" : "review"; }

type LiveReadiness = { mode: "supabase"; result: ReturnType<typeof evaluateMainDemo>; members: Member[]; assets: Asset[]; summary: { onlineAssets: number; offlineAssets: number; maintenanceAssets: number; membersAvailable: number } };

function OperationalReadiness({ navigate, liveReadiness }: { navigate: (view: View, focus?: EvidenceFocus) => void; liveReadiness: LiveReadiness | null }) {
  const sourceMembers = liveReadiness?.members ?? members;
  const sourceAssets = liveReadiness?.assets ?? assets;
  const people = sourceMembers.filter((member) => member.unitId === "harbour");
  const fleet = sourceAssets.filter((asset) => asset.unitId === "harbour");
  const vehicleTypes = new Set(["SPECIALIST_TRUCK", "STORM_TRUCK", "RESCUE_VEHICLE", "FLOOD_BOAT", "FORWARD_COMMAND_VEHICLE", "GENERAL_PURPOSE_VEHICLE", "COMMANDER_UTE"]);
  const vehicles = fleet.filter((asset) => vehicleTypes.has(asset.type));
  const equipment = fleet.filter((asset) => !vehicleTypes.has(asset.type));
  const availablePeople = people.filter((member) => memberState(member) === "Available").length;
  const reviewPeople = people.filter((member) => memberState(member) === "Currency review" || memberState(member) === "Currency lapsed").length;
  const onlineVehicles = vehicles.filter((asset) => assetState(asset) === "Available").length;
  const onlineEquipment = equipment.filter((asset) => assetState(asset) === "Available").length;
  const assetSummary = (items: typeof fleet) => ({ online: items.filter((asset) => assetState(asset) === "Available").length, inUse: items.filter((asset) => assetState(asset) === "Deployed").length, attention: items.filter((asset) => assetState(asset) === "Unavailable" || assetState(asset) === "Review required").length });
  const vehicleSummary = assetSummary(vehicles);
  const equipmentSummary = assetSummary(equipment);
  const checks = preparednessSignals.filter((signal) => signal.status !== "COMPLETE").length;
  const complianceReviews = complianceEvidence.filter((item) => item.status === "DUE_SOON").length;
  const capabilityCounts = ["FLOOD_RESCUE", "CHAINSAW", "STORM_RESPONSE", "SPECIALIST_DRIVER"].map((id) => ({ id, label: capabilityNames[id], count: people.filter((member) => member.competencies.includes(id) && memberState(member) === "Available").length }));
  const maxCapability = Math.max(...capabilityCounts.map((item) => item.count));
  const crewReadiness = availablePeople / people.length;
  const vehicleReadiness = onlineVehicles / vehicles.length;
  const equipmentReadiness = onlineEquipment / equipment.length;
  const readinessScore = Math.round((crewReadiness + vehicleReadiness + equipmentReadiness) / 3 * 100);
  const readinessAssessment = liveReadiness?.result ?? evaluateMainDemo();
  const attentionAssets = fleet.filter((asset) => assetState(asset) === "Unavailable" || assetState(asset) === "Review required");
  const capabilityConstraints = readinessAssessment.bindingConstraints;
  const primaryConstraintResourceId = capabilityConstraints.at(0)?.resourceIds?.at(0);
  const primaryConstraintAsset = primaryConstraintResourceId ? sourceAssets.find((asset) => asset.id === primaryConstraintResourceId) : undefined;
  const capabilityImpact = primaryConstraintAsset ? `${assetNames[primaryConstraintAsset.type] ?? primaryConstraintAsset.type} capability` : capabilityConstraints.length ? "Capability review" : "No assessed constraint";
  const posture = readinessScore >= 85 && !attentionAssets.length && !capabilityConstraints.length ? "Ready" : readinessScore >= 60 ? "Review recommended" : "Reduced readiness";
  const assetAttentionLabel = `${attentionAssets.length} asset${attentionAssets.length === 1 ? "" : "s"} require${attentionAssets.length === 1 ? "s" : ""} source review`;
  const constraintLabel = capabilityConstraints.length ? `${capabilityConstraints.length} assessed capability constraint${capabilityConstraints.length === 1 ? "" : "s"}` : "No assessed capability constraints";
  const profileStops = { crew: crewReadiness / 3 * 100, fleet: (crewReadiness + vehicleReadiness) / 3 * 100, equipment: (crewReadiness + vehicleReadiness + equipmentReadiness) / 3 * 100 };
  const profileGradient = `conic-gradient(#2f9d83 0 ${profileStops.crew}%, #508bb0 ${profileStops.crew}% ${profileStops.fleet}%, #d4a130 ${profileStops.fleet}% ${profileStops.equipment}%, #e7eef0 ${profileStops.equipment}% 100%)`;
  return <main className="em-page em-readiness-page">
    <div className="em-page-heading em-readiness-heading"><div><p className="em-eyebrow">Harbour Station · Live evidence</p><h1>Operational readiness</h1><p className="em-subtitle">A current snapshot of people, fleet, equipment and readiness evidence.</p></div><button className="em-secondary" onClick={() => navigate("overview")}>Open operational overview</button></div>

    <section className="em-readiness-status-strip" aria-label="Current readiness status">
      <div className="em-status-callout"><span><i /> Current posture</span><strong>{posture}</strong><p>{assetAttentionLabel}. {constraintLabel}.</p></div>
      <div className="em-readiness-metric"><span>Readiness index</span><strong>{readinessScore}<small>/100</small></strong></div>
      <div className="em-readiness-metric"><span>Evidence freshness</span><strong><i /> Current</strong></div>
      <div className="em-readiness-impact"><span>Assessed impact</span><strong>{capabilityImpact}</strong><small>{capabilityConstraints.length ? constraintLabel : "Current planning check"}</small></div>
      <button className="em-readiness-impact-action" onClick={() => navigate("overview")}>Review capability impact <span>→</span></button>
    </section>

    <section className="em-readiness-primary-grid" aria-label="Readiness snapshot">
      <article className="em-readiness-index-card"><header><span>Readiness profile</span><button onClick={() => navigate("overview")}>Details →</button></header><div className="em-readiness-index-visual" style={{ background: profileGradient }} role="img" aria-label={`Readiness index ${readinessScore} out of 100: crew ${Math.round(crewReadiness * 100)}%, fleet ${Math.round(vehicleReadiness * 100)}%, equipment ${Math.round(equipmentReadiness * 100)}`}><div><strong>{readinessScore}</strong><span>index</span></div></div><footer><span><i className="crew" /> Crew</span><span><i className="fleet" /> Fleet</span><span><i className="equipment" /> Equipment</span></footer></article>
      <article className="em-readiness-capability-card"><header><div><span>Capability coverage</span><strong>Available members by capability</strong></div><button onClick={() => navigate("evidence", "members")}>View members →</button></header><div className="em-readiness-bars">{capabilityCounts.map((capability) => { const review = capability.id === "SPECIALIST_DRIVER"; return <button key={capability.id} onClick={() => navigate("evidence", "members")}><span>{capability.label}</span><i><b className={review ? "review" : "ready"} style={{ width: `${capability.count / maxCapability * 100}%` }} /></i><strong>{capability.count}</strong><em>{review ? "Review" : "Online"}</em></button>; })}</div></article>
      <article className="em-readiness-assets-card"><header><div><span>Fleet & equipment</span><strong>Asset source status</strong></div><button onClick={() => navigate("evidence", "assets")}>View assets →</button></header>{[{ label: "Vehicles", total: vehicles.length, summary: vehicleSummary, icon: "fleet" as IconName }, { label: "Equipment", total: equipment.length, summary: equipmentSummary, icon: "safety" as IconName }].map((group) => <button className="em-asset-snapshot" key={group.label} onClick={() => navigate("evidence", "assets")}><Icon name={group.icon} /><div><strong>{group.label}</strong><span>{group.summary.online} online · {group.summary.attention} attention</span></div><div className="em-asset-status-track" role="img" aria-label={`${group.label}: ${group.summary.online} online, ${group.summary.inUse} deployed, ${group.summary.attention} attention`}><i className="online" style={{ width: `${group.summary.online / group.total * 100}%` }} /><i className="inuse" style={{ width: `${group.summary.inUse / group.total * 100}%` }} /><i className="attention" style={{ width: `${group.summary.attention / group.total * 100}%` }} /></div><b>{group.summary.online}/{group.total}</b></button>)}</article>
    </section>

    <section className="em-readiness-secondary-grid" aria-label="Readiness detail">
      <button className="em-readiness-snapshot-card crew" onClick={() => navigate("evidence", "members")}><span className="em-snapshot-icon"><Icon name="people" /></span><div><small>Crew availability</small><strong>{availablePeople} <em>of {people.length}</em></strong><span>{reviewPeople} currency reviews due</span></div><i style={{ width: `${availablePeople / people.length * 100}%` }} /></button>
      <button className="em-readiness-snapshot-card safety" onClick={() => navigate("compliance")}><span className="em-snapshot-icon"><Icon name="safety" /></span><div><small>Safety & compliance</small><strong>{complianceReviews} <em>due soon</em></strong><span>{checks} preparedness checks open</span></div><i style={{ width: `${(complianceEvidence.length - complianceReviews) / complianceEvidence.length * 100}%` }} /></button>
      <button className="em-readiness-snapshot-card watch" onClick={() => navigate("overview")}><span className="em-snapshot-icon"><Icon name="overview" /></span><div><small>Change to watch</small><strong>Specialist truck</strong><span>Offline source state · assess capability impact</span></div><b>Review →</b></button>
    </section>
  </main>;
}

function EvidenceExplorer({ focus, liveReadiness }: { focus: EvidenceFocus; liveReadiness: LiveReadiness | null }) {
  const people = (liveReadiness?.members ?? members).filter((member) => member.unitId === "harbour");
  const fleet = (liveReadiness?.assets ?? assets).filter((asset) => asset.unitId === "harbour");
  const [activeSection, setActiveSection] = useState<EvidenceFocus>(focus); const [search, setSearch] = useState(""); const [capability, setCapability] = useState("all"); const [personStatus, setPersonStatus] = useState("all"); const [assetType, setAssetType] = useState("all"); const [assetStatus, setAssetStatus] = useState("all");
  useEffect(() => setActiveSection(focus), [focus]);
  const capabilities = [...new Set(people.flatMap((member) => member.competencies))].sort(); const types = [...new Set(fleet.map((asset) => asset.type))].sort();
  const visiblePeople = people.filter((member) => (!search || `${member.name} ${member.id}`.toLowerCase().includes(search.toLowerCase())) && (capability === "all" || member.competencies.includes(capability)) && (personStatus === "all" || memberState(member) === personStatus));
  const visibleFleet = fleet.filter((asset) => (assetType === "all" || asset.type === assetType) && (assetStatus === "all" || assetState(asset) === assetStatus));
  return <main className="em-page"><div className="em-page-heading"><div><p className="em-eyebrow">Harbour Station</p><h1>People & assets</h1><p className="em-subtitle">Search and filter member, fleet and equipment source records</p></div></div><div className="em-evidence-tabs" role="tablist" aria-label="People and asset records"><button role="tab" aria-selected={activeSection === "members"} className={activeSection === "members" ? "selected" : ""} onClick={() => setActiveSection("members")}>Members</button><button role="tab" aria-selected={activeSection === "assets"} className={activeSection === "assets" ? "selected" : ""} onClick={() => setActiveSection("assets")}>Fleet & equipment</button></div>{activeSection === "members" ? <section className="em-card"><SectionTitle title={`Members (${visiblePeople.length} of ${people.length})`} /><div className="em-controls"><label>Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or ID" /></label><label>Capability<select value={capability} onChange={(event) => setCapability(event.target.value)}><option value="all">All capabilities</option>{capabilities.map((item) => <option value={item} key={item}>{capabilityNames[item] ?? item}</option>)}</select></label><label>Status<select value={personStatus} onChange={(event) => setPersonStatus(event.target.value)}><option value="all">All statuses</option>{["Available", "In use", "Unavailable", "Currency review", "Currency lapsed"].map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="em-data-list">{visiblePeople.map((member) => <article key={member.id}><div><strong>{member.name}</strong><small>{member.id} · {member.competencies.map((item) => capabilityNames[item] ?? item).join(" · ")}</small></div><small>Declared: {member.availableFrom.slice(11, 16)}–{member.availableUntil.slice(11, 16)} UTC · {member.trainingSummary ?? "Current source record"} · {member.experienceYears ?? 0} years evidence</small><Badge tone={memberTone(member)}>{memberState(member)}</Badge></article>)}</div></section> : <section className="em-card"><SectionTitle title={`Fleet & equipment (${visibleFleet.length} of ${fleet.length})`} /><div className="em-controls"><label>Asset type<select value={assetType} onChange={(event) => setAssetType(event.target.value)}><option value="all">All asset types</option>{types.map((item) => <option value={item} key={item}>{assetNames[item] ?? item}</option>)}</select></label><label>Status<select value={assetStatus} onChange={(event) => setAssetStatus(event.target.value)}><option value="all">All statuses</option>{["Available", "Deployed", "Unavailable", "Review required"].map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="em-data-list">{visibleFleet.map((asset) => <article key={asset.id}><div><strong>{asset.name}</strong><small>{assetNames[asset.type] ?? asset.type} · {asset.capacity ?? "No capacity record supplied"}</small></div><small>{asset.offlineUntil ? `Source review through ${asset.offlineUntil.slice(0, 10)}` : asset.remainingUsageHours ? `${asset.remainingUsageHours} hours to service horizon` : asset.sourceCondition === "REVIEW_REQUIRED" ? "Source condition requires review" : "Source status current"}</small><Badge tone={assetTone(asset)}>{assetState(asset)}</Badge></article>)}</div></section>}</main>;
}

function Scenarios({ navigate, onComplete, liveReadiness }: { navigate: (view: View) => void; onComplete: (snapshot: ScenarioSnapshot) => void; liveReadiness: LiveReadiness | null }) {
  const [text, setText] = useState("");
  const [changes, setChanges] = useState<PlanningChange[]>([]);
  const [complete, setComplete] = useState(false);
  const harbourAssets = (liveReadiness?.assets ?? assets).filter((asset) => asset.unitId === "harbour");
  const changeStatus = (assetId: string, status: PlanningStatus) => setChanges((current) => {
    const withoutAsset = current.filter((change) => change.assetId !== assetId);
    return status === "AVAILABLE" ? withoutAsset : [...withoutAsset, { assetId, status }];
  });
  const statusFor = (assetId: string) => changes.find((change) => change.assetId === assetId)?.status ?? "AVAILABLE";
  const finish = () => {
    const summary = text.trim() || (changes.length ? `${changes.length} asset status change${changes.length === 1 ? "" : "s"} assessed.` : "Current Harbour capability assessed.");
    onComplete({ summary, changes });
    setComplete(true);
  };
  return <main className="em-page"><div className="em-page-heading"><div><p className="em-eyebrow">Planning workspace</p><h1>Capability scenarios</h1><p className="em-subtitle">Validate your station&apos;s capability by generating scenarios to test them. Either build it yourself using natural language or utilise the AI-built scenarios. View outcomes in the Operational Overview.</p></div><Badge tone="neutral">Planning only</Badge></div><div className="em-scenario-grid"><section className="em-card"><SectionTitle title="Build a scenario" info="Set a planning-only status for several assets, then compare the resulting capability view. Nothing is changed in a source system." /><label className="em-label" htmlFor="scenario">Scenario note</label><textarea id="scenario" value={text} onChange={(event) => setText(event.target.value)} placeholder="Example: Two vehicles are in workshop maintenance for the next 48 hours." /><div className="em-scenario-assets"><div className="em-scenario-assets-heading"><Icon name="fleet" /><div><strong>Asset changes</strong><small>Choose only the items you want to test.</small></div></div>{harbourAssets.filter((asset) => ["SPECIALIST_TRUCK", "STORM_TRUCK", "RESCUE_VEHICLE", "FLOOD_BOAT", "GENERATOR"].includes(asset.type)).map((asset) => <label key={asset.id}><span><strong>{asset.name}</strong><small>{assetNames[asset.type] ?? asset.type}</small></span><select aria-label={`Planning status for ${asset.name}`} value={statusFor(asset.id)} onChange={(event) => changeStatus(asset.id, event.target.value as PlanningStatus)}><option value="AVAILABLE">No change</option><option value="OFFLINE_UNTIL">Offline</option><option value="MAINTENANCE_DUE">Maintenance</option><option value="IN_USE">Deployed</option></select></label>)}</div><button className="em-primary" onClick={finish}>Generate scenario</button></section><section className="em-card"><SectionTitle title="AI-assisted scenario review" info="The AI reads deterministic evidence and gives concise findings. It cannot make operational or approval decisions." /><p className="em-muted">Use the AI review to test the current Harbour scenario against crew, fleet, equipment and local-support evidence.</p><LiveAgentRun /></section></div>{complete && <div className="em-modal-backdrop" role="presentation"><section className="em-modal" role="dialog" aria-modal="true" aria-labelledby="scenario-complete-title"><Badge tone="ready">Scenario ready</Badge><h2 id="scenario-complete-title">Open the Operational Overview?</h2><p>{changes.length ? `${changes.length} planning-only asset change${changes.length === 1 ? "" : "s"} will be shown in the outcome.` : "Your scenario is ready to review against current capability evidence."}</p><div><button className="em-secondary" onClick={() => setComplete(false)}>Stay here</button><button className="em-primary" onClick={() => navigate("overview")}>Open Operational Overview</button></div></section></div>}</main>;
}

function Preparedness({ liveReadiness }: { liveReadiness: LiveReadiness | null }) {
  const sourceChecks = useSourceRecords("asset-checks");
  const sourceFleet = useSourceRecords("fleet");
  const sourcePlans = useSourceRecords("oms");
  const [sort, setSort] = useState<"asset" | "due" | "status">("due");
  const [checkCategory, setCheckCategory] = useState("all");
  const [checkStatus, setCheckStatus] = useState("all");
  const [assetType, setAssetType] = useState("all");
  const [assetStatus, setAssetStatus] = useState("attention");
  const [planStatus, setPlanStatus] = useState("all");
  const checkRecords = sourceChecks ?? preparednessSignals.map((signal) => ({ key: signal.id, record: signal.asset, evidence: `${signal.category} · ${signal.source}`, status: `${signal.status} · ${signal.due}` }));
  const preparednessChecks = checkRecords.map((record) => {
    const [statusLabel, due = "Not supplied"] = record.status.split(" · ");
    const [category, source = "Connected source"] = record.evidence.split(" · ");
    return { id: record.key, asset: record.record, category, source, due, impact: "Review current source evidence before reliance.", status: statusLabel === "COMPLETE" || statusLabel === "CURRENT" ? "COMPLETE" : "DUE_SOON" as const };
  });
  const categories = [...new Set(preparednessChecks.map((signal) => signal.category))].sort();
  const signals = preparednessChecks.filter((signal) => (checkCategory === "all" || signal.category === checkCategory) && (checkStatus === "all" || signal.status === checkStatus)).sort((a, b) => (sort === "asset" ? a.asset.localeCompare(b.asset) : sort === "status" ? a.status.localeCompare(b.status) : a.due.localeCompare(b.due)));
  const fleet = (liveReadiness?.assets ?? assets).filter((asset) => asset.unitId === "harbour");
  const types = [...new Set(fleet.map((asset) => asset.type))].sort();
  const visibleAssets = fleet.filter((asset) => (assetType === "all" || asset.type === assetType) && (assetStatus === "all" || (assetStatus === "attention" ? assetState(asset) === "Unavailable" || assetState(asset) === "Review required" : assetState(asset) === assetStatus)));
  const planRecords = sourcePlans ?? preparednessPlans.map((plan) => ({ key: plan.id, record: plan.name, evidence: `${plan.owner} · ${plan.reviewed}`, status: plan.status }));
  const plans = planRecords.map((record) => { const [owner, reviewed = "Not supplied"] = record.evidence.split(" · "); return { id: record.key, name: record.record, owner, reviewed, readiness: "Plan remains advisory; current checks are required.", status: record.status === "CURRENT" ? "CURRENT" : "REVIEW_REQUIRED" as const }; });
  const visiblePlans = plans.filter((plan) => planStatus === "all" || plan.status === planStatus);
  const maintenanceRecords = sourceFleet ?? maintenanceEvidence.map((item) => ({ key: item.id, record: item.asset, evidence: item.category, status: `${item.status} · ${item.nextDue}` }));
  const maintenance = maintenanceRecords.map((record) => { const [statusLabel, nextDue = "Not supplied"] = record.status.split(" · "); return { id: record.key, asset: record.record, category: record.evidence, nextDue, lastCompleted: "Not supplied", cycle: "Source record", impact: "Review current source maintenance evidence before reliance.", status: statusLabel === "OVERDUE" ? "OVERDUE" : "DUE_SOON" as const }; });
  return <main className="em-page"><div className="em-page-heading"><div><p className="em-eyebrow">Source evidence</p><h1>Preparedness</h1><p className="em-subtitle">Maintenance, registration, inspection, service and asset-status evidence</p></div></div>
    <section className="em-card"><SectionTitle title={`Preparedness checks (${signals.length} of ${preparednessChecks.length})`} info="Filter and sort current evidence by category, Status, asset or due horizon." /><div className="em-controls"><label>Check type<select value={checkCategory} onChange={(event) => setCheckCategory(event.target.value)}><option value="all">All check types</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={checkStatus} onChange={(event) => setCheckStatus(event.target.value)}><option value="all">All statuses</option><option value="DUE_SOON">Review required</option><option value="COMPLETE">Current</option></select></label></div><div className="em-sort"><span>Sort by</span>{(["due", "asset", "status"] as const).map((item) => <button key={item} className={sort === item ? "selected" : ""} onClick={() => setSort(item)}>{item === "due" ? "Due horizon" : item[0].toUpperCase() + item.slice(1)}</button>)}</div><div className="em-data-list">{signals.map((signal) => <article key={signal.id}><div><strong>{signal.asset}</strong><small>{signal.category} · {signal.source}</small></div><small>Due / horizon: {signal.due} · {signal.impact}</small><Badge tone={signal.status === "COMPLETE" ? "ready" : "review"}>{signal.status === "COMPLETE" ? "Current" : "Review"}</Badge></article>)}</div></section>
    <section className="em-card em-data-section"><SectionTitle title={`Asset evidence (${visibleAssets.length} of ${fleet.length})`} info="All Harbour fleet and equipment records are shown here. Filter to identify unavailable or review-required assets." /><div className="em-controls"><label>Asset type<select value={assetType} onChange={(event) => setAssetType(event.target.value)}><option value="all">All asset types</option>{types.map((item) => <option key={item} value={item}>{assetNames[item] ?? item}</option>)}</select></label><label>Status<select value={assetStatus} onChange={(event) => setAssetStatus(event.target.value)}><option value="attention">Review or unavailable</option><option value="all">All statuses</option>{["Available", "Deployed", "Unavailable", "Review required"].map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="em-data-list">{visibleAssets.map((asset) => <article key={asset.id}><div><strong>{asset.name}</strong><small>{assetNames[asset.type] ?? asset.type} · {asset.capacity ?? "No capacity record supplied"}</small></div><small>{asset.offlineUntil ? `Source review through ${asset.offlineUntil.slice(0, 10)}` : asset.remainingUsageHours ? `${asset.remainingUsageHours} hours to service horizon` : asset.sourceCondition === "REVIEW_REQUIRED" ? "Source condition requires review" : "Source status current"}</small><Badge tone={assetTone(asset)}>{assetState(asset)}</Badge></article>)}</div></section>
    <section className="em-card em-data-section em-maintenance-card"><SectionTitle title="Asset maintenance horizon" info="Due dates are shown first. Open the detail to see the source test cycle and last completed record." /><div className="em-maintenance-summary"><div><Icon name="fleet" /><strong>{maintenance.filter((item) => item.status === "OVERDUE").length}</strong><span>overdue</span></div><div><Icon name="safety" /><strong>{maintenance.filter((item) => item.status === "DUE_SOON").length}</strong><span>due soon</span></div><div><Icon name="readiness" /><strong>{maintenance.length}</strong><span>tracked items</span></div></div><div className="em-maintenance-timeline">{maintenance.map((item) => <details key={item.id} className={item.status === "OVERDUE" ? "overdue" : "due"}><summary><Icon name={item.category.includes("Vehicle") || item.category.includes("service") ? "fleet" : "safety"} /><div><strong>{item.asset}</strong><small>Next due: {item.nextDue}</small></div><Badge tone={item.status === "OVERDUE" ? "gap" : "review"}>{item.status === "OVERDUE" ? "Overdue" : "Due soon"}</Badge></summary><div className="em-maintenance-detail"><span>Last completed <b>{item.lastCompleted}</b></span><span>Test cycle <b>{item.cycle}</b></span><p>{item.impact}</p></div></details>)}</div></section>
    <section className="em-card em-data-section"><SectionTitle title={`Plan readiness (${visiblePlans.length} of ${plans.length})`} info="Plans are source evidence. Current operational checks remain required." /><div className="em-controls"><label>Status<select value={planStatus} onChange={(event) => setPlanStatus(event.target.value)}><option value="all">All statuses</option><option value="CURRENT">Current</option><option value="REVIEW_REQUIRED">Review required</option></select></label></div><div className="em-data-list">{visiblePlans.map((plan) => <article key={plan.id}><div><strong>{plan.name}</strong><small>{plan.owner} · Last reviewed {plan.reviewed}</small></div><small>{plan.readiness}</small><Badge tone={plan.status === "CURRENT" ? "ready" : "review"}>{plan.status === "CURRENT" ? "Current" : "Review required"}</Badge></article>)}</div></section>
  </main>;
}

function SafetyCompliance() {
  const sourceSafety = useSourceRecords("safety");
  const safetyEvidence = sourceSafety ? sourceSafety.map((record) => {
    const [statusLabel, due = "Current"] = record.status.split(" · ");
    return { id: record.key, item: record.record, category: record.evidence, location: "Harbour Station", due, source: "Safety & compliance systems", cycle: "Source record", reminder: "Review the connected source record.", status: statusLabel === "CURRENT" ? "CURRENT" as const : "DUE_SOON" as const };
  }) : complianceEvidence;
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [horizon, setHorizon] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("due");
  const [question, setQuestion] = useState("");
  const resultsRef = useRef<HTMLElement>(null);
  const categories = [...new Set(safetyEvidence.map((item) => item.category))].sort();
  const items = [...new Set(safetyEvidence.map((item) => item.item))].sort();
  const referenceDate = Date.UTC(2026, 7, 28);
  const dueInDays = (due: string) => due === "Current" ? null : Math.round((Date.parse(`${due} UTC`) - referenceDate) / 86_400_000);
  const matchesHorizon = (item: (typeof safetyEvidence)[number]) => {
    if (horizon === "all") return true;
    const days = dueInDays(item.due);
    return days !== null && days >= 0 && days <= Number(horizon);
  };
  const textMatch = search.trim().toLowerCase();
  const visible = safetyEvidence
    .filter((item) =>
      (category === "all" || item.category === category) &&
      (itemFilter === "all" || item.item === itemFilter) &&
      (status === "all" || status === "review" && item.status === "DUE_SOON" || item.status === status) &&
      matchesHorizon(item) &&
      (!textMatch || `${item.item} ${item.category} ${item.location} ${item.source}`.toLowerCase().includes(textMatch)),
    )
    .sort((left, right) => sortBy === "item" ? left.item.localeCompare(right.item) : (dueInDays(left.due) ?? Number.MAX_SAFE_INTEGER) - (dueInDays(right.due) ?? Number.MAX_SAFE_INTEGER));
  const reviewCount = safetyEvidence.filter((item) => item.status === "DUE_SOON").length;
  const currentCount = safetyEvidence.filter((item) => item.status === "CURRENT").length;
  const sources = [...new Set(safetyEvidence.map((item) => item.source))];
  const breakdown = [
    { label: "0–7 days", count: safetyEvidence.filter((item) => item.status === "DUE_SOON" && (dueInDays(item.due) ?? Infinity) <= 7).length, color: "#ca615d" },
    { label: "8–30 days", count: safetyEvidence.filter((item) => item.status === "DUE_SOON" && (dueInDays(item.due) ?? -1) > 7 && (dueInDays(item.due) ?? Infinity) <= 30).length, color: "#d4a130" },
    { label: "31–90 days", count: safetyEvidence.filter((item) => item.status === "DUE_SOON" && (dueInDays(item.due) ?? -1) > 30).length, color: "#5c92ad" },
    { label: "Current", count: currentCount, color: "#3b927e" },
  ];
  const breakdownTotal = breakdown.reduce((total, item) => total + item.count, 0) || 1;
  let position = 0;
  const donutGradient = `conic-gradient(${breakdown.map((item) => { const start = position; position += item.count / breakdownTotal * 100; return `${item.color} ${start}% ${position}%`; }).join(", ")})`;
  const categoryBreakdown = categories.map((name) => ({ name, due: visible.filter((item) => item.category === name && item.status === "DUE_SOON").length, total: visible.filter((item) => item.category === name).length })).filter((item) => item.total > 0);
  const maxCategory = Math.max(1, ...categoryBreakdown.map((item) => item.total));
  const upcoming = safetyEvidence.filter((item) => item.status === "DUE_SOON").sort((left, right) => (dueInDays(left.due) ?? Infinity) - (dueInDays(right.due) ?? Infinity)).slice(0, 3);
  const showDueRecords = () => {
    setCategory("all");
    setItemFilter("all");
    setStatus("review");
    setHorizon("90");
    setSearch("");
    window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const query = question.toLowerCase();
  const answer = query.includes("defib") || query.includes("aed") ? "AED pads and battery: expiry review due 01 Sep 2026 at Harbour Station." : query.includes("first aid") ? "First-aid kit consumables: expiry review due 03 Sep 2026 for the Harbour fleet." : query ? "Use the filters below to narrow the consolidated source evidence by asset, expiry horizon or category." : "";

  return <main className="em-page">
    <div className="em-page-heading em-compliance-heading">
      <div><h1>Safety & compliance</h1><p className="em-subtitle">Expiry, inspections and renewal evidence for the station, fleet and members.</p></div>
      <div className="em-compliance-heading-meta" aria-label="Current compliance context"><span><i /> Harbour Station</span><span>Evidence refreshed 28 Aug 2026</span><Badge tone="review">{reviewCount} due soon</Badge><button onClick={() => { setCategory('all'); setItemFilter('all'); setStatus('all'); setHorizon('all'); setSearch(''); }}>Reset view</button></div>
    </div>

    <section className="em-compliance-search em-ai-compliance-search"><Icon name="ai" /><div><label htmlFor="compliance-question">Ask AI Emma any compliance or expiry questions</label><input id="compliance-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="When are my defibrillator pads expiring?" /></div>{answer && <p>{answer}</p>}</section>

    <section className="em-compliance-workspace" aria-label="Safety and compliance evidence workspace">
      <div className="em-compliance-toolbar">
        <div><strong>Compliance register</strong><span>Explore expiry, asset and safety evidence in one view.</span></div>
        <div className="em-horizon-tabs" aria-label="Expiry horizon">
          {[['all', 'All'], ['7', '7 days'], ['30', '30 days'], ['90', '90 days']].map(([value, label]) => <button key={value} className={horizon === value ? 'active' : ''} onClick={() => setHorizon(value)} aria-pressed={horizon === value}>{label}</button>)}
        </div>
      </div>
      <div className="em-compliance-insights em-compliance-insights-three">
        <section className="em-compliance-chart-card">
          <header><div><span>Expiry horizon</span><strong>{horizon === 'all' ? 'All tracked evidence' : `Due within ${horizon} days`}</strong></div><Badge tone="review">{visible.filter((item) => item.status === 'DUE_SOON').length} due</Badge></header>
          <div className="em-expiry-donut-layout"><div className="em-expiry-donut" style={{ background: donutGradient }} role="img" aria-label={breakdown.map((item) => `${item.label}: ${item.count}`).join(', ')}><div><strong>{reviewCount}</strong><span>due soon</span></div></div><div className="em-horizon-key">{breakdown.map((item) => <button key={item.label} onClick={() => item.label === 'Current' ? setStatus('CURRENT') : (setStatus('review'), setHorizon(item.label === '0–7 days' ? '7' : item.label === '8–30 days' ? '30' : '90'))}><i style={{ background: item.color }} /><span>{item.label}</span><strong>{item.count}</strong></button>)}</div></div>
        </section>
        <section className="em-compliance-chart-card em-next-dates-card">
          <header><div><span>Next critical dates</span><strong>Upcoming attention</strong></div><button className="em-link" onClick={showDueRecords}>See all</button></header>
          <div className="em-next-dates">{upcoming.map((item) => { const days = dueInDays(item.due) ?? 0; return <button key={item.id} onClick={() => { setCategory('all'); setItemFilter(item.item); setStatus('review'); setHorizon('all'); setSearch(''); window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}><time>{item.due.slice(0, 6)}<small>{days === 0 ? 'Due today' : days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}</small></time><span><strong>{item.item}</strong><small>{item.location} · {item.cycle}</small></span><i>→</i></button>; })}</div>
        </section>
        <section className="em-compliance-chart-card">
          <header><div><span>Evidence by category</span><strong>{category === 'all' ? 'Review concentration' : category}</strong></div><button className="em-link" onClick={() => { setCategory('all'); setItemFilter('all'); setSearch(''); }}>Clear</button></header>
          <div className="em-category-bars">{categoryBreakdown.map((item) => <button key={item.name} onClick={() => setCategory(item.name)}><span>{item.name}</span><i><b style={{ width: `${item.total / maxCategory * 100}%` }} /><em style={{ width: `${item.due / maxCategory * 100}%` }} /></i><strong>{item.due ? `${item.due} due` : 'Current'}</strong></button>)}</div>
        </section>
      </div>
      <div className="em-compliance-filters">
        <label>Evidence category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All evidence categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Record or asset<select value={itemFilter} onChange={(event) => setItemFilter(event.target.value)}><option value="all">All records and assets</option>{items.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="review">Due soon</option><option value="CURRENT">Current</option></select></label>
        <label>Find evidence<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="e.g. defibrillator or fire" /></label>
      </div>

      <section ref={resultsRef} className="em-filter-results">
      <SectionTitle title={`Evidence register (${visible.length} of ${safetyEvidence.length})`} info="A consolidated, read-only view. Connected systems retain record ownership and action." action={<label className="em-table-sort">Sort by<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="due">Next due</option><option value="item">Asset or item</option></select></label>} />
      <div className="em-compliance-table" role="table" aria-label="Safety and compliance evidence">
        <div className="em-compliance-table-head" role="row"><span role="columnheader">Asset or item</span><span role="columnheader">Category / location</span><span role="columnheader">Next due</span><span role="columnheader">Source</span><span role="columnheader">Status</span></div>
        {visible.map((item) => <article key={item.id} role="row"><div role="cell" data-label="Asset or item"><strong>{item.item}</strong><small>{item.reminder}</small></div><div role="cell" data-label="Category / location"><strong>{item.category}</strong><small>{item.location} · {item.cycle}</small></div><div role="cell" data-label="Next due"><time>{item.due}</time></div><div role="cell" data-label="Source"><span>{item.source}</span></div><div role="cell" data-label="Status"><Badge tone={item.status === "CURRENT" ? "ready" : "review"}>{item.status === "CURRENT" ? "Current" : "Due soon"}</Badge></div></article>)}
      </div>
      {!visible.length && <p className="em-empty-state">No compliance evidence matches these filters. Clear a filter to return to the full register.</p>}
      </section>
    </section>
  </main>;
}

function WeatherStatus({ weather, loading, onReplay }: { weather: WeatherSignal; loading: boolean; onReplay: () => void }) { return <section className="em-weather-mini"><Icon name="overview" /><div><strong>{loading ? "Checking BOM warnings" : weather.relevant ? weather.warningType : "No relevant BOM warning"}</strong><span>{weather.relevant ? `${weather.area ?? "Area not provided"} · ${weather.sourceFreshness}` : "No capability review triggered"}</span></div><Badge tone={weather.relevant ? "review" : "ready"}>{loading ? "Checking" : weather.mode === "LIVE" ? "BOM live" : "Replay"}</Badge><button className="em-link" onClick={onReplay}>Use replay</button></section>; }
function FleetSnapshot({ sourceAssets, onInspect }: { sourceAssets: Asset[]; onInspect: (assetId: string) => void }) {
  const [group, setGroup] = useState("all");
  const harbourAssets = sourceAssets.filter((asset) => asset.unitId === "harbour");
  const vehicleTypes = new Set(["SPECIALIST_TRUCK", "STORM_TRUCK", "RESCUE_VEHICLE", "FLOOD_BOAT", "FORWARD_COMMAND_VEHICLE", "GENERAL_PURPOSE_VEHICLE", "COMMANDER_UTE"]);
  const visible = harbourAssets.filter((asset) => group === "all" || group === "vehicles" && vehicleTypes.has(asset.type) || group === "equipment" && !vehicleTypes.has(asset.type) || group === "boats" && asset.type === "FLOOD_BOAT");
  const offline = harbourAssets.filter((asset) => asset.status === "OFFLINE_UNTIL").length;
  const maintenance = harbourAssets.filter((asset) => asset.status === "MAINTENANCE_DUE").length;
  const label = (asset: typeof harbourAssets[number]) => asset.status === "AVAILABLE" ? "Online" : asset.status === "IN_USE" ? "Deployed" : asset.status === "OFFLINE_UNTIL" ? "Offline" : "Maintenance review";
  return <section className="em-card em-fleet-snapshot"><SectionTitle title={`Fleet status (${visible.length} of ${harbourAssets.length})`} info="Select any vehicle or equipment item to inspect its current source status." /><p className="em-fleet-summary">{offline} offline · {maintenance} maintenance reviews · remaining items online or deployed</p><div className="em-fleet-filters" role="group" aria-label="Filter fleet status">{[["all", "All"], ["vehicles", "Vehicles"], ["boats", "Boats"], ["equipment", "Equipment"]].map(([id, label]) => <button key={id} className={group === id ? "selected" : ""} onClick={() => setGroup(id)}>{label}</button>)}</div><div className="em-fleet-list">{visible.map((asset) => <button type="button" className="em-fleet-row" key={asset.id} onClick={() => onInspect(asset.id)}><Icon name={vehicleTypes.has(asset.type) ? "fleet" : "data"} /><div><strong>{asset.name}</strong><small>{assetNames[asset.type] ?? asset.type}{asset.offlineUntil ? ` · Expected return ${new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "2-digit" }).format(new Date(asset.offlineUntil))}` : asset.status === "MAINTENANCE_DUE" ? " · Source maintenance review required" : ""}</small></div><Badge tone={asset.status === "AVAILABLE" ? "ready" : asset.status === "IN_USE" ? "in-use" : "review"}>{label(asset)}</Badge><span className="em-fleet-open">View</span></button>)}</div></section>;
}
function SydneyOperationsMap({ sourceAssets, onInspect }: { sourceAssets: Asset[]; onInspect: (assetId: string) => void }) {
  const [filter, setFilter] = useState<"all" | "assets" | "deployed" | "maintenance" | "incidents">("all");
  const [zoom, setZoom] = useState(11);
  const [selected, setSelected] = useState<string | null>(null);
  const selectFilter = (next: typeof filter) => {
    setSelected(null);
    setFilter(next);
  };
  const harbourAssets = sourceAssets.filter((asset) => asset.unitId === "harbour");
  const mapCentre = { lat: -33.895, lng: 151.155 };
  const tileCoordinate = (lat: number, lng: number) => {
    const scale = 2 ** zoom;
    const x = (lng + 180) / 360 * scale;
    const latitudeRadians = lat * Math.PI / 180;
    const y = (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2 * scale;
    return { x, y };
  };
  const centreTile = tileCoordinate(mapCentre.lat, mapCentre.lng);
  const locate = (lat: number, lng: number) => {
    const point = tileCoordinate(lat, lng);
    return { left: `calc(50% + ${(point.x - centreTile.x) * 256}px)`, top: `calc(50% + ${(point.y - centreTile.y) * 256}px)` };
  };
  const tileStart = { x: Math.floor(centreTile.x) - 2, y: Math.floor(centreTile.y) - 2 };
  const tileOffset = { x: (centreTile.x - tileStart.x) * 256, y: (centreTile.y - tileStart.y) * 256 };
  const osmTiles = Array.from({ length: 25 }, (_, index) => {
    const x = tileStart.x + index % 5;
    const y = tileStart.y + Math.floor(index / 5);
    const tileX = ((x % (2 ** zoom)) + 2 ** zoom) % (2 ** zoom);
    return { key: `${zoom}-${tileX}-${y}`, x: tileX, y };
  });
  const fieldAssets = [
    { id: "H-ST03", lat: -33.916, lng: 151.195, place: "Alexandria", state: "Deployed" },
    { id: "H-RV03", lat: -33.871, lng: 151.271, place: "Rose Bay", state: "Deployed" },
    { id: "H-G03", lat: -33.910, lng: 151.155, place: "Marrickville", state: "Deployed" },
    { id: "H-DR03", lat: -33.946, lng: 151.205, place: "Botany", state: "Deployed" },
    { id: "H-S01", lat: -33.815, lng: 151.003, place: "Parramatta", state: "Maintenance" },
  ].map((location) => ({ ...location, asset: harbourAssets.find((asset) => asset.id === location.id) }));
  const incidents = [
    { id: "INC-01", lat: -33.919, lng: 151.198, title: "Flood assistance", place: "Alexandria", status: "Source context" },
    { id: "INC-02", lat: -33.882, lng: 151.226, title: "Storm damage report", place: "Paddington", status: "Source context" },
    { id: "INC-03", lat: -33.945, lng: 151.205, title: "Coastal weather impact", place: "Botany", status: "Source context" },
  ];
  const baseAssetCount = harbourAssets.length - fieldAssets.length;
  const showStation = filter === "all" || filter === "assets";
  const showFieldAssets = filter === "all" || filter === "assets" || filter === "deployed" || filter === "maintenance";
  const showIncidents = filter === "all" || filter === "incidents";
  const selectedAsset = fieldAssets.find((item) => item.id === selected);
  const selectedIncident = incidents.find((item) => item.id === selected);

  return <section className="em-sydney-map-card" aria-labelledby="asset-locations-title">
    <header><div><strong id="asset-locations-title">Asset locations</strong></div><small>Fictional source evidence · not live tracking or dispatch</small></header>
    <div className="em-sydney-map-toolbar"><div role="group" aria-label="Map content">{[["all", "All"], ["assets", "Assets"], ["deployed", "Deployed"], ["maintenance", "Maintenance"], ["incidents", "Operational incidents"]].map(([id, label]) => <button key={id} type="button" className={filter === id ? "selected" : ""} aria-pressed={filter === id} onClick={() => selectFilter(id as typeof filter)}>{label}</button>)}</div><div className="em-map-zoom" role="group" aria-label="Map zoom"><button type="button" onClick={() => setZoom((current) => Math.min(13, current + 1))} aria-label={`Zoom in from level ${zoom}`} disabled={zoom === 13}>+</button><button type="button" onClick={() => setZoom((current) => Math.max(11, current - 1))} aria-label={`Zoom out from level ${zoom}`} disabled={zoom === 11}>−</button></div></div>
    <div className="em-sydney-map" aria-label="Map of Sydney showing Harbour Station, asset source locations and fictional incident context">
      <div className="em-osm-tiles" style={{ left: `calc(50% - ${tileOffset.x}px)`, top: `calc(50% - ${tileOffset.y}px)` }} aria-hidden="true">{osmTiles.map((tile) => <img key={tile.key} src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`} alt="" />)}</div>
      <div className="em-sydney-map-markers">
        {showStation && <button className="em-map-marker station" style={locate(-33.9025, 151.185)} onClick={() => setSelected("station")} aria-label={`${baseAssetCount} assets at Harbour Station, 125 Railway Parade Erskineville`}><Icon name="readiness" /><span>{baseAssetCount}</span></button>}
        {showFieldAssets && fieldAssets.filter((item) => filter === "all" || filter === "assets" || filter === item.state.toLowerCase()).map((item) => <button key={item.id} className={`em-map-marker ${item.state === "Maintenance" ? "maintenance" : "deployed"}`} style={locate(item.lat, item.lng)} onClick={() => setSelected(item.id)} aria-label={`${item.asset?.name ?? item.id}, ${item.state}, ${item.place}`}><Icon name="fleet" /></button>)}
        {showIncidents && incidents.map((incident) => <button key={incident.id} className="em-map-marker incident" style={locate(incident.lat, incident.lng)} onClick={() => setSelected(incident.id)} aria-label={`${incident.title}, ${incident.place}`}><span>!</span></button>)}
      </div>
      {selected && <aside className="em-map-popup"><button onClick={() => setSelected(null)} aria-label="Close map detail">×</button>{selected === "station" ? <><strong>Harbour Station</strong><span>125 Railway Parade, Erskineville</span><p>{baseAssetCount} source records at station. Select Assets to compare field locations.</p></> : selectedAsset ? <><strong>{selectedAsset.asset?.name ?? selectedAsset.id}</strong><span>{selectedAsset.state} · {selectedAsset.place}</span><p>{selectedAsset.asset ? `${assetNames[selectedAsset.asset.type] ?? selectedAsset.asset.type} source location.` : "Source location."}</p><button className="em-link" onClick={() => onInspect(selectedAsset.id)}>View asset record →</button></> : selectedIncident ? <><strong>{selectedIncident.title}</strong><span>{selectedIncident.place}</span><p>Fictional incident context from a connected operational source.</p></> : null}</aside>}
      <div className="em-map-legend"><span><i className="station" /> Harbour Station</span><span><i className="deployed" /> Deployed</span><span><i className="maintenance" /> Maintenance</span><span><i className="incident" /> Operational incident</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a></div>
    </div>
  </section>;
}
function MapPanel({ weather: _weather, sourceAssets, onInspect }: { weather: WeatherSignal; sourceAssets: Asset[]; onInspect: (assetId: string) => void }) { return <div className="em-map-stack"><SydneyOperationsMap sourceAssets={sourceAssets} onInspect={onInspect} /><FleetSnapshot sourceAssets={sourceAssets} onInspect={onInspect} /></div>; }

function AssetDetail({ assetId, onBack, sourceAssets }: { assetId: string | null; onBack: () => void; sourceAssets: Asset[] }) {
  const asset = sourceAssets.find((item) => item.id === assetId) ?? sourceAssets.find((item) => item.id === "H-S01")!;
  const state = assetState(asset);
  const tone = assetTone(asset);
  const statusDetail = asset.status === "OFFLINE_UNTIL" ? `Expected return: ${asset.offlineUntil ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(asset.offlineUntil)) : "not supplied"}.` : asset.status === "MAINTENANCE_DUE" ? "Source maintenance review is required before this asset is relied on." : asset.status === "IN_USE" ? "Current source evidence marks this asset as deployed." : asset.remainingUsageHours ? `${asset.remainingUsageHours} operating hours remain before its source service horizon.` : "Current source evidence marks this asset online.";
  return <main className="em-page narrow"><div className="em-page-heading"><div><p className="em-eyebrow">Harbour Station · asset record</p><h1>{asset.name}</h1><p className="em-subtitle">Current capability and maintenance evidence</p></div><button className="em-secondary" onClick={onBack}>← Back to Operational Overview</button></div><section className="em-card em-asset-detail"><div className="em-asset-detail-icon"><Icon name={asset.type.includes("TRUCK") || asset.type.includes("VEHICLE") || asset.type === "FLOOD_BOAT" ? "fleet" : "data"} /></div><div><Badge tone={tone}>{state}</Badge><h2>{assetNames[asset.type] ?? asset.type}</h2><p>{asset.capacity ?? "No capacity record supplied."}</p></div></section><section className="em-card em-data-section"><SectionTitle title="Current record" /><dl className="em-asset-facts"><div><dt>Source status</dt><dd>{state}</dd></div><div><dt>Source condition</dt><dd>{asset.sourceCondition === "REVIEW_REQUIRED" ? "Review required" : "Current"}</dd></div><div><dt>Availability</dt><dd>{statusDetail}</dd></div><div><dt>Owning station</dt><dd>Harbour Station</dd></div></dl></section></main>;
}
function OperationalOverview({ weather, loading, onReplay, navigate, scenario, onResetScenario, onInspectAsset, liveReadiness }: { weather: WeatherSignal; loading: boolean; onReplay: () => void; navigate: (view: View) => void; scenario: ScenarioSnapshot | null; onResetScenario: () => void; onInspectAsset: (assetId: string) => void; liveReadiness: LiveReadiness | null }) {
  const [horizon, setHorizon] = useState<12 | 24 | 36 | 48 | 72>(24);
  const changeByAsset = new Map((scenario?.changes ?? []).map((change) => [change.assetId, change.status]));
  const sourceAssets = liveReadiness?.assets ?? assets;
  const sourceMembers = liveReadiness?.members ?? members;
  const planningAssets = useMemo(() => sourceAssets.map((asset) => ({ ...asset, status: changeByAsset.get(asset.id) ?? asset.status, offlineUntil: changeByAsset.get(asset.id) === "OFFLINE_UNTIL" ? "2026-09-05T00:00:00Z" : asset.offlineUntil })), [sourceAssets, scenario]);
  const fixtureResult = useMemo(() => scenario ? liveReadiness ? evaluateMainDemoWithEvidence({ members: sourceMembers, assets: planningAssets }) : evaluateMainDemoWithAssets(planningAssets) : evaluateMainDemo(), [liveReadiness, planningAssets, scenario, sourceMembers]);
  const result = scenario ? fixtureResult : liveReadiness?.result ?? fixtureResult;
  const offlineAssets = planningAssets.filter((asset) => asset.unitId === "harbour" && asset.status === "OFFLINE_UNTIL");
  const maintenanceAssets = planningAssets.filter((asset) => asset.unitId === "harbour" && asset.status === "MAINTENANCE_DUE");
  const harbourAssets = planningAssets.filter((asset) => asset.unitId === "harbour");
  const harbourMembers = sourceMembers.filter((member) => member.unitId === "harbour");
  const planningEnd = Date.parse(demoScenario.startAt) + horizon * 3_600_000;
  const availableMembers = harbourMembers.filter((member) => memberState(member) === "Available" && Date.parse(member.availableFrom) <= Date.parse(demoScenario.startAt) && Date.parse(member.availableUntil) >= planningEnd);
  const forecastAvailableAssets = harbourAssets.filter((asset) => asset.status === "AVAILABLE" || asset.status === "OFFLINE_UNTIL" && asset.offlineUntil && Date.parse(asset.offlineUntil) <= planningEnd);
  const forecastAttentionAssets = harbourAssets.filter((asset) => (asset.status === "OFFLINE_UNTIL" && (!asset.offlineUntil || Date.parse(asset.offlineUntil) > planningEnd)) || asset.status === "MAINTENANCE_DUE");
  const profile = { members: availableMembers.length, fleet: forecastAvailableAssets.length, attention: forecastAttentionAssets.length };
  const formatEvidenceDate = (value?: string) => value ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC", timeZoneName: "short" }).format(new Date(value)) : "Not supplied";
  const requirements = ["Flood rescue", "Chainsaw", "Specialist truck", "Storm reserve", "Flood boat", "Qualified boat operator", "Radio communications", "Incident management"];
  const hasSpecialistGap = result.bindingConstraints.some((constraint) => constraint.type === "ASSET_OFFLINE" || constraint.message.includes("SPECIALIST_TRUCK"));
  return <main className="em-page"><div className="em-page-heading"><div><p className="em-eyebrow">Harbour Station</p><h1>Operational overview</h1><p className="em-subtitle">{scenario ? "Planning snapshot — only the selected scenario changes are being assessed." : "Live overview from current source evidence."}</p></div>{scenario ? <button className="em-secondary" onClick={onResetScenario}>Reset to live overview</button> : <Badge tone="ready">Live overview</Badge>}</div>{scenario && <section className="em-scenario-banner"><Icon name="scenario" /><div><strong>Scenario being assessed</strong><span>{scenario.summary}</span></div><Badge tone="neutral">Planning only</Badge></section>}<WeatherStatus weather={weather} loading={loading} onReplay={onReplay} /><div className="em-workspace"><div><section className="em-assessment-visual"><div><Icon name="scenario" /><span>Planning period</span><strong>{horizon} hours</strong></div><div><Icon name="people" /><span>Members</span><strong>{profile.members} / {harbourMembers.length} declared</strong></div><div><Icon name="fleet" /><span>Fleet forecast</span><strong>{profile.fleet} / {harbourAssets.length} online</strong></div><div><Icon name="data" /><span>Asset changes</span><strong>{scenario?.changes.length ?? 0}</strong></div></section><section className="em-card"><SectionTitle title="Capability outcome" info="All eight measures combine relevant members, vehicles, equipment and source evidence." /><div className="em-result-grid">{requirements.map((name) => { const specificGap = name === "Specialist truck" && hasSpecialistGap; const review = !specificGap && (name === "Flood boat" && maintenanceAssets.some((asset) => asset.type === "FLOOD_BOAT") || name === "Qualified boat operator"); return <article key={name} className={specificGap ? "gap" : review ? "review" : "ready"}><span>{specificGap ? "!" : review ? "~" : "✓"}</span><div><strong>{name}</strong><small>{specificGap ? `${offlineAssets[0]?.name ?? "Required vehicle"} offline${offlineAssets[0]?.offlineUntil ? ` · expected return ${new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(offlineAssets[0].offlineUntil))}` : ""}` : review ? "Maintenance or currency review required" : "Members and required assets online"}</small></div><Badge tone={specificGap ? "gap" : review ? "review" : "ready"}>{specificGap ? "Offline" : review ? "Review" : "Online"}</Badge></article>; })}</div></section><section className="em-card"><SectionTitle title="Availability horizon" info="Declared member availability and expected asset return times across the selected planning period; this is not a roster." /><div className="em-horizon-control" role="group" aria-label="Select planning horizon">{([12, 24, 36, 48, 72] as const).map((hours) => <button key={hours} className={horizon === hours ? "selected" : ""} onClick={() => setHorizon(hours)}>{hours} hrs</button>)}</div><div className="em-availability-chart" role="img" aria-label={`${profile.members} members and ${profile.fleet} assets available over ${horizon} hours`}><div><span>Declared members</span><strong>{profile.members}</strong><i><b style={{ width: `${harbourMembers.length ? profile.members / harbourMembers.length * 100 : 0}%` }} /></i></div><div><span>Fleet forecast</span><strong>{profile.fleet}</strong><i><b style={{ width: `${harbourAssets.length ? profile.fleet / harbourAssets.length * 100 : 0}%` }} /></i></div><div><span>Assets under review</span><strong>{profile.attention}</strong><i><b className="gap" style={{ width: `${Math.max(4, harbourAssets.length ? profile.attention / harbourAssets.length * 100 : 0)}%` }} /></i></div></div></section>{offlineAssets.length > 0 && <section className="em-offline-detail"><Icon name="fleet" /><div><span>Current asset issues · {offlineAssets.length} offline</span><strong>Source review and planned return</strong><div className="em-offline-issues">{offlineAssets.map((asset) => <article key={asset.id}><strong>{asset.name}</strong><small>Offline from {formatEvidenceDate(asset.offlineSince)} · Planned return {formatEvidenceDate(asset.offlineUntil)}</small><p>{asset.offlineReason ?? "Source status is offline; a current clearance check is required before reliance."}</p><button className="em-link" onClick={() => onInspectAsset(asset.id)}>View asset →</button></article>)}</div></div></section>}</div><aside><MapPanel weather={weather} sourceAssets={planningAssets} onInspect={onInspectAsset} /></aside></div></main>;
}

function LocalSupport({ agentDraftResource }: { agentDraftResource: string | null }) {
  const options = findNeighbourSupport();
  const activeRequests = temporaryHostingRequests.filter((request) => request.status === "REVIEWING");
  const outgoing = temporaryHostingRequests.filter((request) => request.direction === "OUTGOING");
  const incoming = temporaryHostingRequests.filter((request) => request.direction === "INCOMING");
  const requestOptions = ["Specialist truck", "Flood boat", "Qualified driver", "Flood rescue technician"];
  const [selected, setSelected] = useState<string[]>(["Specialist truck"]);
  const [drafted, setDrafted] = useState(false);
  const [approved, setApproved] = useState(false);
  useEffect(() => { if (agentDraftResource) setDrafted(true); }, [agentDraftResource]);
  const toggle = (item: string) => { setDrafted(false); setSelected((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]); };
  const requestRows = (requests: ReadonlyArray<(typeof temporaryHostingRequests)[number]>) => <div className="em-data-list">{requests.map((request) => <article key={request.id}><div><strong>{request.asset}</strong><small>{request.direction === "OUTGOING" ? `Requested from ${request.donor}` : `Requested by ${request.requester}`} · {request.period}</small></div><small>{request.reason}</small><Badge tone={request.status === "RETURNED" ? "neutral" : approved && request.id === "HOST-014" ? "ready" : "review"}>{request.status === "RETURNED" ? "Returned" : approved && request.id === "HOST-014" ? "Approved" : "Reviewing"}</Badge></article>)}</div>;
  return <main className="em-page"><div className="em-page-heading"><div><p className="em-eyebrow">Harbour Station · after station gap</p><h1>Local support</h1><p className="em-subtitle">Identify what Harbour needs, then prepare one station-to-station support request.</p></div></div>
    <section className="em-card"><SectionTitle title="Harbour support need" info="This is the capability Harbour needs to cover its current gap. It is not a direction to any other station." /><div className="em-callout gap"><strong>Specialist truck capability gap</strong><p>Harbour Specialist 01 is unavailable in current source evidence. Harbour needs a specialist truck for the 18:00–06:00 planning period.</p></div></section>
    <section className="em-card em-data-section"><SectionTitle title="Available local support" info="These are aggregate options another station may be able to share while retaining its own minimum readiness." /><div className="em-support-list">{options.map((option) => <article key={option.resourceId}><div><strong>{option.resourceName}</strong><small>Available from {option.supplyingUnitName.replace("Unit ", "")} Station · 18:00–06:00</small></div><div><strong>{option.donorImpact.availableAfter} remaining</strong><small>Supplying-station minimum: {option.donorImpact.minimumReadiness}</small></div><Badge tone="ready">May be shared</Badge></article>)}</div></section>
    <section className="em-card em-data-section"><SectionTitle title="Prepare a combined support request" info="Select the capability elements Harbour needs. This creates a draft for human review; it does not allocate people or assets." /><div className="em-request-options">{requestOptions.map((item) => <button type="button" key={item} className={selected.includes(item) ? "selected" : ""} aria-pressed={selected.includes(item)} onClick={() => toggle(item)}>{item}</button>)}</div><p className="em-muted">Request contents: {selected.length ? selected.join(" · ") : "Select one or more capability elements."}</p>{drafted ? <div className="em-callout neutral"><strong>{agentDraftResource ? "Agent-prepared draft ready for human review" : "Draft support request prepared"}</strong><p>{selected.join(", ")}{agentDraftResource ? ` · agent reference: ${agentDraftResource}` : ""}. A receiving station and an authorised human must review the capability, availability and supplying-station impact before approval.</p></div> : <button className="em-primary" disabled={!selected.length} onClick={() => setDrafted(true)}>Prepare draft request</button>}</section>
    <section className="em-card em-data-section"><SectionTitle title="Related support requests" info="Both requests from Harbour and requests received by Harbour are reviewed here." /><div className="em-data-list">{activeRequests.map((request) => <article key={request.id}><div><strong>{request.direction === "OUTGOING" ? `Request to ${request.donor}` : `Request from ${request.requester}`}</strong><small>{request.asset} · {request.period}</small></div><small>{request.reason}</small><Badge tone="review">Reviewing</Badge></article>)}</div></section>
    <div className="em-two-col wide"><div><section className="em-card"><SectionTitle title={`Outgoing requests (${outgoing.length})`} info="Support requested by Harbour from another local station." />{requestRows(outgoing)}</section><section className="em-card em-data-section"><SectionTitle title={`Incoming requests (${incoming.length})`} info="Support requested from Harbour by another local station." />{requestRows(incoming)}</section></div><aside className="em-card"><SectionTitle title="HOST-014 review" /><p>Ridge retains 1 specialist vehicle against its minimum readiness of 1.</p>{approved ? <div className="em-callout ready"><strong>Approval recorded</strong><p>Operational systems remain responsible for any use.</p></div> : <button className="em-primary" onClick={() => setApproved(true)}>Record human approval</button>}</aside></div></main>;
}

const toolLabels: Record<string, string> = { get_unit_readiness: "Readiness evidence checked", evaluate_capability_plan: "Capability requirement checked", find_single_points_of_failure: "Dependencies checked", find_local_cluster_support: "Local support checked" };
function LiveAgentRun() { const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle"); const [findings, setFindings] = useState<string[]>([]); const run = async () => { setState("running"); setFindings([]); try { const response = await fetch("/api/agent/review", { method: "POST" }); const payload = await response.json() as { findings?: string[]; summary?: string; error?: string; trace?: Array<{ tool: string; result: string }> }; if (!response.ok) throw new Error(payload.error ?? "AI review could not be completed."); (payload.trace ?? []).forEach((entry) => window.dispatchEvent(new CustomEvent("emergency-mesh-tool-result", { detail: { action: toolLabels[entry.tool] ?? entry.tool, value: entry.result } }))); setFindings(payload.findings ?? (payload.summary ? payload.summary.split(/(?<=[.!?])\s+/).filter(Boolean) : ["Review completed."])); setState("done"); } catch (error) { setFindings([error instanceof Error ? error.message : "AI review could not be completed."]); setState("error"); } }; return <div className="em-live-agent"><button className="em-primary" type="button" onClick={run} disabled={state === "running"}>{state === "running" ? "Reviewing…" : "Run AI review"}</button>{findings.length > 0 && <div className={`em-callout ${state === "error" ? "gap" : "neutral"}`}><strong>{state === "error" ? "AI review unavailable" : "Review findings"}</strong><ul className="em-plain-list">{findings.map((finding, index) => <li key={index}>{finding}</li>)}</ul></div>}</div>; }
function Agent() { const [activity, setActivity] = useState<Array<{ action: string; result: string }>>([]); useEffect(() => { const listener = (event: Event) => { const detail = (event as CustomEvent<{ action: string; value: unknown }>).detail; setActivity((current) => [{ action: detail.action, result: typeof detail.value === "string" ? detail.value : "Evidence returned." }, ...current]); }; window.addEventListener("emergency-mesh-tool-result", listener); return () => window.removeEventListener("emergency-mesh-tool-result", listener); }, []); return <main className="em-page"><div className="em-page-heading"><div><p className="em-eyebrow">AI + browser tools</p><h1>AI Assisted Review</h1><p className="em-subtitle">Concise findings backed by capability evidence</p></div><Badge tone="neutral">Human decision required</Badge></div><div className="em-two-col wide"><section className="em-card"><SectionTitle title="Capability review" info="The AI reads readiness, capability, dependency and local-support evidence. It cannot make operational or approval decisions." /><div className="em-review-basis"><strong>Review basis</strong><span>Planning period: 18:00–06:00 · Requirements: flood rescue, chainsaw, specialist truck and storm reserve</span><span>Evidence: declared member availability and currency, asset status, maintenance horizons and local support after a gap</span></div><LiveAgentRun /><WebMcpBridge /><div className="em-agent-log">{activity.length ? activity.map((entry, index) => <div key={`${entry.action}-${index}`}><strong>{entry.action}</strong><span>{entry.result}</span></div>) : <p className="em-muted">Run a review to see evidence checks.</p>}</div></section><aside className="em-card"><SectionTitle title="Review scope" /><ul className="em-plain-list"><li>Checks capability evidence and dependencies</li><li>Identifies shared local support after a gap</li><li>Does not initiate operations</li><li>Does not approve on a person’s behalf</li></ul></aside></div></main>; }
function Sources({ weatherEnabled, setWeatherEnabled, onReplay }: { weatherEnabled: boolean; setWeatherEnabled: (value: boolean) => void; onReplay: () => void }) {
  const feeds = [["membership", "Membership records", "Member identity and station association."], ["availability", "Availability system", "Declared membership availability."], ["training", "Member training & currency", "Qualification and renewal evidence."], ["asset-register", "Asset register", "Asset identity, capacity and ownership."], ["fleet", "Fleet management system", "Fleet status and maintenance cycles."], ["asset-checks", "Asset readiness checks", "Inspection, service and registration evidence."], ["safety", "Safety & compliance systems", "Safety, inspection and expiry evidence."], ["oms", "Operational management system / CAD", "Requirement and planning context."]] as const;
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(feeds.map(([id]) => [id, true])));
  const [setupState, setSetupState] = useState<"idle" | "loading" | "ready">("idle");
  const initialRecords: Record<string, Array<[string, string, string]>> = { membership: members.filter((member) => member.unitId === "harbour").map((member) => [member.name, member.id, member.sourceStatus === "OFFLINE" ? "Inactive" : "Active"]), availability: members.filter((member) => member.unitId === "harbour").map((member) => [member.name, `${member.availableFrom.slice(11, 16)}–${member.availableUntil.slice(11, 16)}`, member.sourceStatus === "IN_USE" ? "In use" : "Declared available"]), training: members.filter((member) => member.unitId === "harbour").flatMap((member) => member.competencies.map((competency) => [member.name, competency.replaceAll("_", " "), member.trainingCurrency === "CURRENT" ? "Current" : member.trainingCurrency === "LAPSED" ? "Lapsed" : "Review required"] as [string, string, string])), "asset-register": assets.filter((asset) => asset.unitId === "harbour").map((asset) => [asset.name, assetNames[asset.type] ?? asset.type, assetState(asset)]), fleet: maintenanceEvidence.map((item) => [item.asset, item.category, `${item.status === "OVERDUE" ? "Overdue" : "Due soon"} · ${item.nextDue}`]), "asset-checks": preparednessSignals.map((item) => [item.asset, item.category, item.status === "COMPLETE" ? "Current" : `Review · ${item.due}`]), safety: complianceEvidence.map((item) => [item.item, item.location, item.status === "CURRENT" ? "Current" : `Due · ${item.due}`]), oms: preparednessPlans.map((plan) => [plan.name, plan.owner, plan.status === "CURRENT" ? "Current" : "Review required"]) };
  const [records, setRecords] = useState(initialRecords);
  const [supabaseRecords, setSupabaseRecords] = useState<Record<string, Array<[string, string, string]>>>({});
  const [sourceKeys, setSourceKeys] = useState<Record<string, string[]>>({});
  const [loadedSources, setLoadedSources] = useState<Record<string, boolean>>({});
  const [liveSourceCount, setLiveSourceCount] = useState(0);
  const [sourceAudit, setSourceAudit] = useState<Record<string, { count: number; lastAmendedAt: string | null; lastAmendedBy: string | null }>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ source: string; index: number; key?: string; isAdded?: boolean; row: [string, string, string] } | null>(null);
  const Toggle = ({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) => <button type="button" className="em-switch" role="switch" aria-checked={checked} aria-label={`${label}: ${checked ? "enabled" : "disabled"}`} onClick={onClick}><span /></button>;
  const saveRecord = async () => {
    if (!editing) return;
    const response = await fetch("/api/data/source-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: editing.source, key: editing.key, record: editing.row[0], evidence: editing.row[1], status: editing.row[2], isAdded: editing.isAdded }) });
    const payload = await response.json() as { key?: string; error?: string };
    if (!response.ok || !payload.key) { setSaveError(payload.error ?? "Unable to save this correction."); return; }
    const savedKey = payload.key;
    setRecords((current) => ({ ...current, [editing.source]: editing.isAdded ? [editing.row, ...current[editing.source]] : current[editing.source].map((row, index) => index === editing.index ? editing.row : row) }));
    setSupabaseRecords((current) => ({ ...current, [editing.source]: editing.isAdded ? [editing.row, ...(current[editing.source] ?? [])] : (current[editing.source] ?? []).map((row, index) => index === editing.index ? editing.row : row) }));
    setSourceKeys((current) => ({ ...current, [editing.source]: editing.isAdded ? [savedKey, ...(current[editing.source] ?? [])] : current[editing.source] ?? [] }));
    setSaveError(null);
    setSourceAudit((current) => ({ ...current, [editing.source]: { count: (current[editing.source]?.count ?? 0) + 1, lastAmendedAt: new Date().toISOString(), lastAmendedBy: "Signed-in reviewer" } }));
    setEditing(null);
  };
  const loadSource = (source: string) => {
    if (loadedSources[source]) return;
    setLoadedSources((current) => ({ ...current, [source]: true }));
    void fetch(`/api/data/source-records?source=${source}`)
      .then((response) => response.json())
      .then((payload: { mode?: string; records?: Array<Record<string, unknown>>; corrections?: { count: number; lastAmendedAt: string | null; lastAmendedBy: string | null } }) => {
        if (payload.mode !== "supabase" || !payload.records?.length) return;
        const mapped = payload.records.map((record) => [String(record.record ?? "—"), String(record.evidence ?? "—"), String(record.status ?? "—")] as [string, string, string]);
        setSupabaseRecords((current) => ({ ...current, [source]: mapped }));
        setSourceKeys((current) => ({ ...current, [source]: payload.records!.map((record) => String(record.key ?? "")) }));
        if (payload.corrections) setSourceAudit((current) => ({ ...current, [source]: payload.corrections! }));
      })
      .catch(() => undefined);
  };
  useEffect(() => {
    let active = true;
    void Promise.all(feeds.map(async ([source]) => {
      try {
        const response = await fetch(`/api/data/source-records?source=${source}`);
        const payload = await response.json() as { mode?: string; records?: Array<Record<string, unknown>> };
        if (payload.mode !== "supabase" || !payload.records?.length) return null;
        return [source, payload.records.map((record) => ({ key: String(record.key ?? ""), row: [String(record.record ?? "—"), String(record.evidence ?? "—"), String(record.status ?? "—")] as [string, string, string] }))] as const;
      } catch { return null; }
    })).then((results) => {
      if (!active) return;
      const live: Record<string, Array<[string, string, string]>> = {};
      const keys: Record<string, string[]> = {};
      results.forEach((result) => { if (result) { live[result[0]] = result[1].map((item) => item.row); keys[result[0]] = result[1].map((item) => item.key); } });
      setLiveSourceCount(Object.keys(live).length);
      setSupabaseRecords(live);
      setSourceKeys(keys);
      setLoadedSources(Object.fromEntries(Object.keys(live).map((source) => [source, true])));
    });
    return () => { active = false; };
  }, []);
  const beginSetup = () => { setSetupState("loading"); window.setTimeout(() => setSetupState("ready"), 700); };
  return <main className="em-page narrow"><div className="em-page-heading"><div><p className="em-eyebrow">Configuration</p><h1>Data & settings</h1><p className="em-subtitle">Source connections and editable demonstration records</p></div></div><section className={`em-callout ${liveSourceCount ? "ready" : "neutral"}`}><Icon name="data" /><div><strong>{liveSourceCount ? "Supabase source data connected" : "Checking source connection"}</strong><p>{liveSourceCount ? `${liveSourceCount} source tables loaded from the Emergency Mesh database.` : "Loading source records from the configured database."}</p></div><Badge tone={liveSourceCount ? "ready" : "neutral"}>{liveSourceCount ? "Live" : "Checking"}</Badge></section><section className="em-card"><SectionTitle title="Connected systems" action={<button className="em-secondary" onClick={beginSetup}>{setupState === "loading" ? "Setting up…" : setupState === "ready" ? "Connection ready" : "Set up connection"}</button>} /><div className="em-feed-list"><article><div><strong>BOM weather awareness</strong><small>Checks the warning feed when Operational overview opens.</small></div><Toggle checked={weatherEnabled} onClick={() => setWeatherEnabled(!weatherEnabled)} label="BOM weather awareness" /></article>{feeds.map(([id, name, description]) => <article key={id}><div><strong>{name}</strong><small>{description}</small></div><Toggle checked={enabled[id]} onClick={() => setEnabled((current) => ({ ...current, [id]: !current[id] }))} label={name} /></article>)}<article><div><strong>Weather replay</strong><small>Restores the known demonstration scenario.</small></div><button className="em-secondary" onClick={onReplay}>Load replay</button></article></div></section><section className="em-card em-data-section"><SectionTitle title="Source data" info="Open a source to add or amend a persisted correction. It does not alter an upstream operational system." />{feeds.map(([id, name, description]) => { const activeRows = supabaseRecords[id] ?? records[id]; return <details className="em-source-accordion" key={id} onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open) loadSource(id); }}><summary><Icon name={id === "membership" || id === "availability" || id === "training" ? "people" : id === "safety" ? "safety" : "fleet"} /><div><strong>{name}</strong><small>{description}</small></div><span>{activeRows.length} records{supabaseRecords[id] ? " · live" : ""}</span></summary><div className="em-source-table" role="table" aria-label={`${name} records`}><div role="row"><strong>Record</strong><strong>Evidence</strong><strong>Status / due</strong><span /></div>{activeRows.map((row, index) => <div role="row" key={`${id}-${index}-${row.join("-")}`}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><button className="em-link" onClick={() => setEditing({ source: id, index, key: sourceKeys[id]?.[index], row: [...row] as [string, string, string] })}>Amend</button></div>)}</div><button className="em-secondary em-add-record" onClick={() => setEditing({ source: id, index: -1, isAdded: true, row: ["", "", ""] })}>Add record</button></details>; })}</section>{editing && <div className="em-modal-backdrop" role="presentation"><section className="em-modal em-amend-modal" role="dialog" aria-modal="true" aria-labelledby="amend-title"><h2 id="amend-title">{editing.isAdded ? "Add source record" : "Amend source record"}</h2><label>Record<input value={editing.row[0]} onChange={(event) => setEditing({ ...editing, row: [event.target.value, editing.row[1], editing.row[2]] })} /></label><label>Evidence<input value={editing.row[1]} onChange={(event) => setEditing({ ...editing, row: [editing.row[0], event.target.value, editing.row[2]] })} /></label><label>Status or due<input value={editing.row[2]} onChange={(event) => setEditing({ ...editing, row: [editing.row[0], editing.row[1], event.target.value] })} /></label><p>Saves a persistent correction to this fictional source feed.</p><div><button className="em-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="em-primary" onClick={() => void saveRecord()}>Save change</button></div></section></div>}</main>;
}
function Activity() {
  const [events, setEvents] = useState<Array<{ source_id: string; record_key: string; action: string; previous_value: { record?: string; evidence?: string; status?: string } | null; next_value: { record?: string; evidence?: string; status?: string }; actor_label: string | null; occurred_at: string }>>([]);
  useEffect(() => { void fetch("/api/data/audit").then((response) => response.json()).then((payload: { events?: typeof events }) => setEvents(payload.events ?? [])).catch(() => undefined); }, []);
  return <main className="em-page narrow"><div className="em-page-heading"><div><p className="em-eyebrow">Audit trail</p><h1>Activity</h1><p className="em-subtitle">Read-only record of persisted source corrections</p></div></div>{events.length > 0 ? <section className="em-card em-data-section"><SectionTitle title="Source correction history" info="Shows who changed a correction, when it changed, and the previous value." /><div className="em-data-list">{events.map((event) => <article key={`${event.record_key}-${event.occurred_at}`}><div><strong>{event.next_value.record ?? event.record_key}</strong><small>{event.source_id} · {event.action === "CREATED" ? "Correction created" : `Previous: ${event.previous_value?.status ?? "—"} → ${event.next_value.status ?? "—"}`}</small></div><small>{new Date(event.occurred_at).toLocaleString()} · {event.actor_label ?? "Signed-in reviewer"}</small><Badge tone="neutral">Audited</Badge></article>)}</div></section> : <section className="em-card em-empty-state"><strong>No persisted source corrections yet.</strong><p>Amend a fictional source record in Data & settings to create an auditable entry. Emergency Mesh does not fabricate activity history.</p></section>}</main>;
}

export function StationReadinessApp() {
  const [view, setView] = useState<View>("readiness");
  const [evidenceFocus, setEvidenceFocus] = useState<EvidenceFocus>("members");
  const [scenario, setScenario] = useState<ScenarioSnapshot | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ view: View; focus: EvidenceFocus; assetId: string | null }>>([]);
  const [weather, setWeather] = useState<WeatherSignal>(demoWeatherSignal);
  const [loading, setLoading] = useState(false);
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [liveReadiness, setLiveReadiness] = useState<LiveReadiness | null>(null);
  const [agentDraftResource, setAgentDraftResource] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void fetch("/api/data/readiness")
      .then((response) => response.json())
      .then((payload: LiveReadiness | { mode?: string }) => {
        if (active && payload.mode === "supabase") setLiveReadiness(payload as LiveReadiness);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  const navigate = (next: View, focus?: EvidenceFocus) => {
    setHistory((current) => [...current, { view, focus: evidenceFocus, assetId: selectedAssetId }]);
    if (next === "evidence" && focus) setEvidenceFocus(focus);
    setView(next);
  };
  const selectPrimaryView = (next: View) => { setHistory([]); setSelectedAssetId(null); setView(next); };
  const goBack = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((current) => current.slice(0, -1));
    setView(previous.view);
    setEvidenceFocus(previous.focus);
    setSelectedAssetId(previous.assetId);
  };
  const checkBom = async () => { if (!weatherEnabled) return; setLoading(true); try { const response = await fetch("/api/weather/bom"); if (!response.ok) throw new Error(); setWeather(await response.json() as WeatherSignal); } catch { setWeather({ mode: "LIVE", relevant: false, sourceUrl: "https://www.bom.gov.au/australia/warnings/", sourceFreshness: "Live source unavailable — check the official source.", attribution: "Source: Bureau of Meteorology RSS feed." }); } finally { setLoading(false); } };
  useEffect(() => { if (view === "overview") void checkBom(); }, [view, weatherEnabled]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [view]);
  useEffect(() => {
    const applyAgentUiEffect = (event: Event) => {
      const value = (event as CustomEvent<{ value?: { uiEffect?: string; resourceId?: string } }>).detail.value;
      if (value?.uiEffect === "open_weather_review") setView("scenarios");
      if (value?.uiEffect === "draft_support_request") { setAgentDraftResource(value.resourceId ?? null); setView("support"); }
      if (value?.uiEffect === "open_support_review") setView("support");
    };
    window.addEventListener("emergency-mesh-tool-result", applyAgentUiEffect);
    return () => window.removeEventListener("emergency-mesh-tool-result", applyAgentUiEffect);
  }, []);
  const inspectAsset = (assetId: string) => { setHistory((current) => [...current, { view, focus: evidenceFocus, assetId: selectedAssetId }]); setSelectedAssetId(assetId); setView("asset"); };
  const persistScenario = (snapshot: ScenarioSnapshot) => { setScenario(snapshot); void fetch("/api/scenarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snapshot) }); };
  const previousView = history.at(-1)?.view;
  const previousLabel = previousView ? nav.find((item) => item.id === previousView)?.label ?? "previous view" : "previous view";
  const screens: Record<View, React.ReactNode> = { readiness: <OperationalReadiness navigate={navigate} liveReadiness={liveReadiness} />, evidence: <EvidenceExplorer focus={evidenceFocus} liveReadiness={liveReadiness} />, scenarios: <Scenarios navigate={navigate} onComplete={persistScenario} liveReadiness={liveReadiness} />, preparedness: <Preparedness liveReadiness={liveReadiness} />, compliance: <SafetyCompliance />, overview: <OperationalOverview weather={weather} loading={loading} onReplay={() => setWeather(demoWeatherSignal)} navigate={navigate} scenario={scenario} onResetScenario={() => setScenario(null)} onInspectAsset={inspectAsset} liveReadiness={liveReadiness} />, asset: <AssetDetail assetId={selectedAssetId} onBack={goBack} sourceAssets={liveReadiness?.assets ?? assets} />, support: <LocalSupport agentDraftResource={agentDraftResource} />, agent: <Agent />, sources: <Sources weatherEnabled={weatherEnabled} setWeatherEnabled={setWeatherEnabled} onReplay={() => setWeather(demoWeatherSignal)} />, activity: <Activity /> };
  return <div className="em-shell"><WebMcpBridge showStatus={false} /><aside className="em-sidebar"><button className="em-brand" onClick={() => selectPrimaryView("readiness")}><span>EM</span><strong>Emergency<br />Mesh</strong></button><nav aria-label="Primary navigation">{nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => selectPrimaryView(item.id)}><span className="em-nav-icon"><Icon name={item.icon} /></span><span className="em-nav-label">{item.label}</span></button>)}</nav><p className="em-sidebar-note">Capability intelligence<br />Not operational control</p></aside><div className="em-content">{history.length > 0 && view !== "asset" && <button className="em-app-back" onClick={goBack} aria-label={`Back to ${previousLabel}`}>← Back to {previousLabel}</button>}{screens[view]}</div></div>;
}
