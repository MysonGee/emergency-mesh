"use client";
import { useState } from "react";
import { evaluateMainDemo, findMinimumInterventions, findNeighbourSupport } from "@/domain/network";

export function ScenarioPlanner() {
  const [ran, setRan] = useState(false); const [draft, setDraft] = useState<string>(); const [approved, setApproved] = useState(false);
  const result = evaluateMainDemo(); const support = findNeighbourSupport();
  return <section aria-labelledby="planner-title"><p className="eyebrow">Scenario planner</p><h2 id="planner-title">Overnight capability plan</h2><p className="lede">18:00–06:00 · Harbour · Storm reserve retained</p><button onClick={() => setRan(true)}>Run plan</button>{ran && <><p className="result blocked">Not ready</p><ul>{result.bindingConstraints.map(c => <li key={c.message}>{c.message}</li>)}</ul><h3>Support</h3>{support.map(o => <article key={o.resourceId}><p>Donor safe</p><h3>{o.resourceName}</h3><span>{o.reason}</span><button onClick={() => setDraft(o.resourceId)}>Draft request</button></article>)}<h3>Alternatives</h3><ul>{findMinimumInterventions().map(i => <li key={i.resourceId}>{i.label}</li>)}</ul></>}{draft && <aside className="notice"><b>Draft request · {draft}</b><p>Unit Ridge retains minimum readiness. Human approval required.</p>{!approved ? <button onClick={() => setApproved(true)}>Approve</button> : <p className="result ready">Approved</p>}</aside>}</section>;
}
