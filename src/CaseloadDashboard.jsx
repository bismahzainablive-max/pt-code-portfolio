import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const FLAG_OPTIONS = [
  "New or increasing pain",
  "Loss of prior functional gains",
  "Non-adherence to home exercise program",
  "Reported symptom warranting referral",
];

const INITIAL_PATIENTS = [
  {
    id: "p1", name: "J. Alvarez", condition: "ACL-R (6 wks)", daysSince: 42,
    milestonesMet: 2, milestonesTotal: 4,
    trend: [62, 68, 74], flags: [false, false, false, false],
    soap: { s: "Reports knee feels 'stronger' but still avoids stairs.", o: "Quad LSI 68%. Full ROM. No effusion.", a: "Progressing toward strength phase, slightly behind quad symmetry target.", p: "Progress closed-chain loading, reassess LSI in 2 weeks." },
  },
  {
    id: "p2", name: "M. Chen", condition: "Rotator cuff repair (10 wks)", daysSince: 70,
    milestonesMet: 3, milestonesTotal: 4,
    trend: [40, 55, 63], flags: [false, false, false, false],
    soap: { s: "Sleeping through the night without pain for the first time.", o: "AROM flexion 150°, MMT 4/5 ER.", a: "On track for return-to-lifting phase.", p: "Begin resistance band progression, add scapular stability work." },
  },
  {
    id: "p3", name: "R. Okafor", condition: "Chronic low back pain", daysSince: 21,
    milestonesMet: 1, milestonesTotal: 4,
    trend: [45, 42, 44], flags: [true, false, true, false],
    soap: { s: "Pain flared after attempting HEP without supervision, missed 2 sessions.", o: "Guarded movement pattern, reduced lumbar AROM.", a: "Plateaued — adherence barrier likely primary driver.", p: "Simplify HEP, address barriers to adherence next visit." },
  },
  {
    id: "p4", name: "S. Patel", condition: "Total knee arthroplasty (4 wks)", daysSince: 28,
    milestonesMet: 2, milestonesTotal: 4,
    trend: [30, 48, 58], flags: [false, false, false, false],
    soap: { s: "Walking to the mailbox without a cane for the first time.", o: "Flexion 105°, extension lag resolving.", a: "Good early progress, on expected trajectory.", p: "Advance gait training, add stair negotiation practice." },
  },
  {
    id: "p5", name: "T. Nguyen", condition: "Ankle sprain, grade II", daysSince: 10,
    milestonesMet: 3, milestonesTotal: 4,
    trend: [55, 70, 82], flags: [false, false, false, false],
    soap: { s: "Feels 'almost back to normal', eager to return to running.", o: "Single-leg balance 45s, no instability on exam.", a: "Ahead of typical timeline for this presentation.", p: "Begin return-to-run progression, monitor for overload." },
  },
  {
    id: "p6", name: "L. Bianchi", condition: "Post-op lumbar fusion (8 wks)", daysSince: 56,
    milestonesMet: 1, milestonesTotal: 4,
    trend: [35, 33, 30], flags: [false, true, false, true],
    soap: { s: "New numbness in left foot since last visit, denies bowel/bladder changes.", o: "Diminished sensation L5 distribution, otherwise stable exam.", a: "New neuro finding — outside scope for continued routine PT pending review.", p: "Hold progression, contact surgical team today, document and follow up." },
  },
];

function expectedMilestones(daysSince) {
  if (daysSince < 14) return 1;
  if (daysSince < 42) return 2;
  if (daysSince < 84) return 3;
  return 4;
}

function Sparkline({ values }) {
  const W = 100, H = 32, PAD = 4;
  const max = 100, min = 0;
  const n = values.length;
  const xFor = (i) => (n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - PAD * 2));
  const yFor = (v) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="cd-spark">
      <path d={d} fill="none" />
      <circle cx={xFor(n - 1)} cy={yFor(values[n - 1])} r={2.5} />
    </svg>
  );
}

export default function CaseloadDashboard() {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedId, setSelectedId] = useState(INITIAL_PATIENTS[0].id);

  const selected = patients.find((p) => p.id === selectedId);

  const statusOf = (p) => {
    if (p.flags.some(Boolean)) return "flag";
    if (p.milestonesMet < expectedMilestones(p.daysSince)) return "behind";
    return "ok";
  };

  const summary = useMemo(() => {
    const flagCount = patients.filter((p) => p.flags.some(Boolean)).length;
    const behindCount = patients.filter((p) => statusOf(p) === "behind").length;
    const readyCount = patients.filter((p) => p.milestonesMet >= p.milestonesTotal).length;
    return { total: patients.length, flagCount, behindCount, readyCount };
  }, [patients]);

  const toggleFlag = (patientId, idx) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        const nextFlags = [...p.flags];
        nextFlags[idx] = !nextFlags[idx];
        return { ...p, flags: nextFlags };
      })
    );
  };

  const updateSoap = (patientId, field, value) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, soap: { ...p.soap, [field]: value } } : p))
    );
  };

  const adjustMilestones = (patientId, delta) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, milestonesMet: Math.max(0, Math.min(p.milestonesTotal, p.milestonesMet + delta)) }
          : p
      )
    );
  };

  return (
    <div className="cd-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .cd-app {
          --bg: #10161B; --surface: #171F26; --surface-raised: #1D2731; --line: #2A343E;
          --ink: #EDEDE5; --muted: #8B96A0;
          --ok: #6B8E4E; --behind: #C9A227; --flag: #C0392B; --teal: #4A90A4;
          font-family: 'Inter', sans-serif; background: var(--bg); color: var(--ink);
          padding: 40px 22px 60px; min-height: 100%;
        }
        .cd-app * { box-sizing: border-box; }
        .cd-shell { max-width: 1180px; margin: 0 auto; }
        .cd-back { display: inline-block; font-size: 12.5px; color: var(--muted); text-decoration: none; margin-bottom: 18px; }
        .cd-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
        .cd-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: clamp(24px, 4vw, 34px); margin: 0 0 10px; letter-spacing: -0.01em; }
        .cd-sub { font-size: 14px; color: var(--muted); max-width: 680px; line-height: 1.55; margin: 0 0 14px; }
        .cd-disclaimer { display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #E0C463; background: rgba(201,162,39,0.1); border: 1px solid rgba(201,162,39,0.35); padding: 7px 12px; border-radius: 6px; margin-bottom: 10px; }

        .cd-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 22px; margin-bottom: 22px; }
        .cd-summary-card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
        .cd-summary-value { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 26px; }
        .cd-summary-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
        .cd-summary-card.flag .cd-summary-value { color: #E88A80; }
        .cd-summary-card.behind .cd-summary-value { color: #E0C463; }
        .cd-summary-card.ready .cd-summary-value { color: #9BC17E; }

        .cd-layout { display: grid; grid-template-columns: 300px 1fr; gap: 18px; align-items: start; }
        @media (max-width: 860px) { .cd-layout { grid-template-columns: 1fr; } }

        .cd-list { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
        .cd-list-item { width: 100%; text-align: left; display: flex; align-items: center; gap: 10px; padding: 13px 16px; border: none; border-bottom: 1px solid var(--line); background: transparent; cursor: pointer; color: var(--ink); }
        .cd-list-item:last-child { border-bottom: none; }
        .cd-list-item.active { background: var(--surface-raised); }
        .cd-status-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .cd-status-dot.ok { background: var(--ok); }
        .cd-status-dot.behind { background: var(--behind); }
        .cd-status-dot.flag { background: var(--flag); }
        .cd-list-name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 13.5px; }
        .cd-list-cond { font-size: 11.5px; color: var(--muted); }

        .cd-detail { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 24px; }
        .cd-detail-head { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .cd-detail-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 19px; }
        .cd-detail-cond { font-size: 13px; color: var(--muted); margin-top: 3px; }

        .cd-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
        @media (max-width: 560px) { .cd-row { grid-template-columns: 1fr; } }
        .cd-card { background: var(--surface-raised); border: 1px solid var(--line); border-radius: 10px; padding: 16px; }
        .cd-card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 13px; margin-bottom: 12px; }

        .cd-milestone-row { display: flex; align-items: center; gap: 10px; }
        .cd-milestone-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); cursor: pointer; font-family: 'IBM Plex Mono', monospace; }
        .cd-milestone-value { font-family: 'IBM Plex Mono', monospace; font-size: 13px; }
        .cd-milestone-note { font-size: 11px; color: var(--muted); margin-top: 8px; }

        .cd-spark { width: 100%; height: 36px; }
        .cd-spark path { stroke: var(--teal); stroke-width: 2; }
        .cd-spark circle { fill: var(--teal); }
        .cd-trend-value { font-family: 'IBM Plex Mono', monospace; font-size: 18px; font-weight: 600; margin-top: 8px; }

        .cd-flag-item { display: flex; align-items: flex-start; gap: 9px; font-size: 12.5px; line-height: 1.45; padding: 5px 0; cursor: pointer; }
        .cd-flag-item input { margin-top: 3px; accent-color: var(--flag); }

        .cd-soap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 560px) { .cd-soap-grid { grid-template-columns: 1fr; } }
        .cd-soap-field label { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
        .cd-soap-field textarea { width: 100%; min-height: 64px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; color: var(--ink); font-family: 'Inter', sans-serif; font-size: 12.5px; padding: 8px 10px; resize: vertical; }

        .cd-footer { margin-top: 26px; font-size: 11px; color: var(--muted); line-height: 1.6; border-top: 1px solid var(--line); padding-top: 16px; }
      `}</style>

      <div className="cd-shell">
        <Link to="/" className="cd-back">← All prototypes</Link>
        <div className="cd-eyebrow">Prototype · Flagship System Design</div>
        <h1 className="cd-title">Multi-Patient Caseload Dashboard</h1>
        <p className="cd-sub">
          Six synthetic patients on one shared state model. Toggle a red flag or adjust a milestone
          for any patient and watch their status dot — and the caseload-wide counters above — update
          together, live.
        </p>
        <div className="cd-disclaimer">Educational prototype — synthetic patients, not real data.</div>

        <div className="cd-summary">
          <div className="cd-summary-card">
            <div className="cd-summary-value">{summary.total}</div>
            <div className="cd-summary-label">Total caseload</div>
          </div>
          <div className="cd-summary-card flag">
            <div className="cd-summary-value">{summary.flagCount}</div>
            <div className="cd-summary-label">Active flags</div>
          </div>
          <div className="cd-summary-card behind">
            <div className="cd-summary-value">{summary.behindCount}</div>
            <div className="cd-summary-label">Behind timeline</div>
          </div>
          <div className="cd-summary-card ready">
            <div className="cd-summary-value">{summary.readyCount}</div>
            <div className="cd-summary-label">Ready to progress</div>
          </div>
        </div>

        <div className="cd-layout">
          <div className="cd-list">
            {patients.map((p) => {
              const status = statusOf(p);
              return (
                <button key={p.id} className={`cd-list-item ${p.id === selectedId ? "active" : ""}`} onClick={() => setSelectedId(p.id)}>
                  <span className={`cd-status-dot ${status}`} />
                  <div>
                    <div className="cd-list-name">{p.name}</div>
                    <div className="cd-list-cond">{p.condition}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="cd-detail">
              <div className="cd-detail-head">
                <div>
                  <div className="cd-detail-name">{selected.name}</div>
                  <div className="cd-detail-cond">{selected.condition} · Day {selected.daysSince}</div>
                </div>
              </div>

              <div className="cd-row">
                <div className="cd-card">
                  <div className="cd-card-title">Phase progress</div>
                  <div className="cd-milestone-row">
                    <button className="cd-milestone-btn" onClick={() => adjustMilestones(selected.id, -1)}>−</button>
                    <span className="cd-milestone-value">{selected.milestonesMet}/{selected.milestonesTotal} milestones met</span>
                    <button className="cd-milestone-btn" onClick={() => adjustMilestones(selected.id, 1)}>+</button>
                  </div>
                  <div className="cd-milestone-note">
                    Expected by day {selected.daysSince}: {expectedMilestones(selected.daysSince)}/{selected.milestonesTotal} —{" "}
                    {selected.milestonesMet < expectedMilestones(selected.daysSince) ? "behind typical timeline" : "on or ahead of typical timeline"}
                  </div>
                </div>
                <div className="cd-card">
                  <div className="cd-card-title">Outcome trend (function index)</div>
                  <Sparkline values={selected.trend} />
                  <div className="cd-trend-value">{selected.trend[selected.trend.length - 1]}%</div>
                </div>
              </div>

              <div className="cd-row">
                <div className="cd-card">
                  <div className="cd-card-title">Red flags</div>
                  {FLAG_OPTIONS.map((f, idx) => (
                    <label className="cd-flag-item" key={idx}>
                      <input type="checkbox" checked={selected.flags[idx]} onChange={() => toggleFlag(selected.id, idx)} />
                      {f}
                    </label>
                  ))}
                </div>
                <div className="cd-card">
                  <div className="cd-card-title">Quick status</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                    {selected.flags.some(Boolean) ? (
                      <span style={{ color: "#E88A80" }}>⚠ Active flag — review before continuing progression.</span>
                    ) : selected.milestonesMet < expectedMilestones(selected.daysSince) ? (
                      <span style={{ color: "#E0C463" }}>Behind expected phase for this timepoint.</span>
                    ) : (
                      <span style={{ color: "#9BC17E" }}>On track — no flags, criteria aligned with timeline.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="cd-card">
                <div className="cd-card-title">SOAP note</div>
                <div className="cd-soap-grid">
                  {["s", "o", "a", "p"].map((field) => (
                    <div className="cd-soap-field" key={field}>
                      <label>{{ s: "Subjective", o: "Objective", a: "Assessment", p: "Plan" }[field]}</label>
                      <textarea value={selected.soap[field]} onChange={(e) => updateSoap(selected.id, field, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="cd-footer">
          Built as a portfolio prototype demonstrating shared-state system design: patient status,
          caseload-wide summary counters, and detail views all derive from one array of patient
          objects rather than being tracked independently per view.
        </div>
      </div>
    </div>
  );
}
