import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const PHASES = [
  {
    id: 0,
    name: "Protection & Early ROM",
    short: "Protection",
    range: [0, 14],
    rangeLabel: "Days 0–14",
    color: "#4A90A4",
    criteria: [
      "Full passive knee extension (0°), equal to uninvolved side",
      "Knee flexion ≥ 90°",
      "Minimal-to-no effusion",
      "Voluntary quad contraction, no extension lag",
      "Independent, non-antalgic gait pattern",
    ],
  },
  {
    id: 1,
    name: "Progressive Loading & Neuromuscular Control",
    short: "Progressive Loading",
    range: [14, 42],
    rangeLabel: "Days 14–42",
    color: "#C9A227",
    criteria: [
      "Full active ROM (0–135°+)",
      "No effusion at rest or after activity",
      "Normal gait without assistive device",
      "Single-leg stance ≥ 30 sec without compensation",
      "Pain-free closed-chain strengthening at bodyweight",
    ],
  },
  {
    id: 2,
    name: "Strength & Return-to-Run Prep",
    short: "Strength & Run Prep",
    range: [42, 84],
    rangeLabel: "Days 42–84",
    color: "#C9622B",
    criteria: [
      "Quad strength limb symmetry index (LSI) ≥ 70%",
      "Pain-free single-leg squat through available range",
      "No pain or swelling reaction to progressive loading",
      "Cleared by surgeon/PT to begin run progression",
    ],
  },
  {
    id: 3,
    name: "Advanced Training & RTS Preparation",
    short: "Advanced / RTS Prep",
    range: [84, 270],
    rangeLabel: "Days 84–270+",
    color: "#6B8E4E",
    criteria: [
      "Quad & hamstring strength LSI ≥ 90%",
      "Hop test battery LSI ≥ 90% (single, triple, crossover, 6m timed)",
      "Sport-specific agility drills tolerated without compensation",
      "Psychological readiness addressed (e.g. ACL-RSI)",
    ],
  },
];

const RED_FLAGS = [
  "Loss of knee extension compared to prior visit",
  "New or increasing effusion",
  "Sharp or increasing pain at rest",
  "Episode of instability / giving way",
  "Signs of infection at incision site",
];

const TIMELINE_MAX = 270;

function initCriteriaState() {
  const state = {};
  PHASES.forEach((p) => {
    state[p.id] = new Array(p.criteria.length).fill(false);
  });
  return state;
}

export default function AclNavigator() {
  const [days, setDays] = useState(28);
  const [checked, setChecked] = useState(initCriteriaState);
  const [openPhase, setOpenPhase] = useState(1);
  const [flags, setFlags] = useState(new Array(RED_FLAGS.length).fill(false));

  const toggleCriterion = (phaseId, idx) => {
    setChecked((prev) => {
      const next = { ...prev, [phaseId]: [...prev[phaseId]] };
      next[phaseId][idx] = !next[phaseId][idx];
      return next;
    });
  };

  const toggleFlag = (idx) => {
    setFlags((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const phaseFullyMet = (phaseId) => checked[phaseId].every(Boolean);

  // Highest phase index that is fully cleared AND all prior phases also cleared.
  const criteriaClearedIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < PHASES.length; i++) {
      if (phaseFullyMet(i)) idx = i;
      else break;
    }
    return idx;
  }, [checked]);

  const activePhaseIndex = Math.min(criteriaClearedIndex + 1, PHASES.length - 1);

  const timeExpectedIndex = useMemo(() => {
    for (let i = 0; i < PHASES.length; i++) {
      const [start, end] = PHASES[i].range;
      if (days < end || i === PHASES.length - 1) return i;
    }
    return PHASES.length - 1;
  }, [days]);

  // Segment layout: equal width per phase for readability.
  const segWidth = 100 / PHASES.length;

  const timeMarkerPos = useMemo(() => {
    const phase = PHASES[timeExpectedIndex];
    const [start, end] = phase.range;
    const clampedDays = Math.min(Math.max(days, start), end);
    const frac = end === start ? 1 : (clampedDays - start) / (end - start);
    return timeExpectedIndex * segWidth + frac * segWidth;
  }, [days, timeExpectedIndex]);

  const criteriaMarkerPos = useMemo(() => {
    if (criteriaClearedIndex === PHASES.length - 1) {
      return PHASES.length * segWidth - 2;
    }
    const phase = PHASES[activePhaseIndex];
    const total = phase.criteria.length;
    const metCount = checked[phase.id].filter(Boolean).length;
    const frac = total === 0 ? 0 : metCount / total;
    return activePhaseIndex * segWidth + frac * segWidth;
  }, [checked, activePhaseIndex, criteriaClearedIndex]);

  const anyFlag = flags.some(Boolean);

  let statusLabel = "On track";
  let statusTone = "ok";
  if (criteriaClearedIndex < timeExpectedIndex - 0.001 && activePhaseIndex <= timeExpectedIndex) {
    if (activePhaseIndex < timeExpectedIndex || (activePhaseIndex === timeExpectedIndex && criteriaMarkerPos < timeMarkerPos - 0.5)) {
      statusLabel = "Behind typical timeline — criteria-limited";
      statusTone = "warn";
    }
  }
  if (activePhaseIndex > timeExpectedIndex || (criteriaClearedIndex >= 0 && criteriaMarkerPos > timeMarkerPos + 0.5)) {
    statusLabel = "Ahead of typical timeline";
    statusTone = "ahead";
  }

  return (
    <div className="acl-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

        .acl-app {
          --bg: #10161B;
          --surface: #171F26;
          --surface-raised: #1D2731;
          --line: #2A343E;
          --ink: #EDEDE5;
          --ink-muted: #8B96A0;
          --alert: #C0392B;
          --alert-bg: rgba(192,57,43,0.12);
          --ahead: #6B8E4E;
          --warn: #C9A227;
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--ink);
          padding: 40px 24px 64px;
          min-height: 100%;
          box-sizing: border-box;
        }
        .acl-app * { box-sizing: border-box; }
        .acl-shell { max-width: 980px; margin: 0 auto; }

        .acl-back {
          display: inline-block;
          font-size: 12.5px;
          color: var(--ink-muted);
          text-decoration: none;
          margin-bottom: 18px;
        }
        .acl-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-bottom: 10px;
        }
        .acl-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: clamp(26px, 4vw, 36px);
          line-height: 1.15;
          margin: 0 0 10px;
          letter-spacing: -0.01em;
        }
        .acl-sub {
          font-size: 14.5px;
          color: var(--ink-muted);
          max-width: 640px;
          line-height: 1.55;
          margin: 0 0 6px;
        }
        .acl-disclaimer {
          display: inline-block;
          margin-top: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--warn);
          background: rgba(201,162,39,0.1);
          border: 1px solid rgba(201,162,39,0.35);
          padding: 7px 12px;
          border-radius: 6px;
          line-height: 1.5;
        }

        .acl-panel {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 26px;
          margin-top: 28px;
        }

        .acl-input-row {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .acl-label {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 15px;
        }
        .acl-days-input {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 20px;
          font-weight: 600;
          background: var(--surface-raised);
          border: 1px solid var(--line);
          color: var(--ink);
          border-radius: 8px;
          padding: 8px 12px;
          width: 90px;
        }
        .acl-days-input:focus-visible {
          outline: 2px solid #4A90A4;
          outline-offset: 2px;
        }
        .acl-slider {
          flex: 1;
          min-width: 200px;
          accent-color: #4A90A4;
        }
        .acl-days-suffix {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: var(--ink-muted);
        }

        .acl-track-wrap { margin-top: 30px; }
        .acl-track {
          position: relative;
          height: 46px;
          border-radius: 8px;
          overflow: visible;
          display: flex;
        }
        .acl-seg {
          height: 100%;
          position: relative;
          border-right: 2px solid var(--bg);
        }
        .acl-seg:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
        .acl-seg:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; border-right: none; }
        .acl-seg-labels {
          display: flex;
          margin-top: 8px;
        }
        .acl-seg-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          color: var(--ink-muted);
          text-align: left;
          padding-left: 2px;
        }
        .acl-marker {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 18px;
          height: 18px;
          border-radius: 50%;
          transition: left 0.25s ease;
        }
        .acl-marker.ghost {
          background: transparent;
          border: 2px dashed var(--ink-muted);
          top: -12px;
        }
        .acl-marker.solid {
          background: var(--ink);
          border: 3px solid var(--bg);
          box-shadow: 0 0 0 2px var(--ink);
          bottom: -12px;
          top: auto;
          transform: translate(-50%, 50%);
        }
        .acl-legend {
          display: flex;
          gap: 20px;
          margin-top: 22px;
          flex-wrap: wrap;
          font-size: 12px;
          color: var(--ink-muted);
        }
        .acl-legend-item { display: flex; align-items: center; gap: 7px; }
        .acl-legend-dot {
          width: 12px; height: 12px; border-radius: 50%;
        }

        .acl-status {
          margin-top: 24px;
          padding: 14px 16px;
          border-radius: 10px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 14.5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .acl-status.ok { background: rgba(107,142,78,0.12); color: #9BC17E; border: 1px solid rgba(107,142,78,0.35); }
        .acl-status.warn { background: rgba(201,162,39,0.12); color: #E0C463; border: 1px solid rgba(201,162,39,0.35); }
        .acl-status.ahead { background: rgba(74,144,164,0.12); color: #7FC1D6; border: 1px solid rgba(74,144,164,0.35); }

        .acl-accordion { margin-top: 28px; }
        .acl-phase-card {
          border: 1px solid var(--line);
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
          background: var(--surface-raised);
        }
        .acl-phase-head {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 16px 18px;
          background: transparent;
          border: none;
          color: var(--ink);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
        }
        .acl-phase-head:focus-visible { outline: 2px solid #4A90A4; outline-offset: -2px; }
        .acl-phase-head-left { display: flex; align-items: center; gap: 12px; }
        .acl-phase-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .acl-phase-name {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 15px;
        }
        .acl-phase-range {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--ink-muted);
        }
        .acl-phase-status {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--ink-muted);
        }
        .acl-phase-status.cleared { color: #9BC17E; }
        .acl-chevron { color: var(--ink-muted); font-size: 12px; transition: transform 0.2s ease; }
        .acl-chevron.open { transform: rotate(180deg); }

        .acl-criteria-list {
          padding: 0 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .acl-criterion {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--ink);
          cursor: pointer;
        }
        .acl-criterion input {
          margin-top: 3px;
          accent-color: #4A90A4;
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }

        .acl-flags-panel { border-color: var(--line); }
        .acl-flags-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 15px;
          margin: 0 0 4px;
        }
        .acl-flags-sub {
          font-size: 12.5px;
          color: var(--ink-muted);
          margin: 0 0 16px;
        }
        .acl-flags-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 10px;
        }
        .acl-flag-item {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 13px;
          line-height: 1.45;
          cursor: pointer;
        }
        .acl-flag-item input { margin-top: 3px; accent-color: var(--alert); }
        .acl-alert-banner {
          margin-top: 18px;
          background: var(--alert-bg);
          border: 1px solid rgba(192,57,43,0.4);
          color: #E88A80;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .acl-footer {
          margin-top: 32px;
          font-size: 11.5px;
          color: var(--ink-muted);
          line-height: 1.6;
          border-top: 1px solid var(--line);
          padding-top: 18px;
        }

        @media (max-width: 640px) {
          .acl-panel { padding: 18px; }
          .acl-seg-label { display: none; }
        }
      `}</style>

      <div className="acl-shell">
        <Link to="/" className="acl-back">← All prototypes</Link>
        <div className="acl-eyebrow">Prototype · Clinical Decision Support</div>
        <h1 className="acl-title">ACL Reconstruction — Rehab Phase Navigator</h1>
        <p className="acl-sub">
          Criterion-based progression, not just a calendar. Enter days since surgery and check off
          milestones as they're met — the tool shows where the calendar says a patient should be
          versus where their actual criteria say they are.
        </p>
        <div className="acl-disclaimer">
          Educational prototype — not a substitute for individualized clinical judgment. Actual
          protocols vary by surgeon, graft type, and concomitant procedures.
        </div>

        <div className="acl-panel">
          <div className="acl-input-row">
            <span className="acl-label">Days since surgery</span>
            <input
              type="number"
              className="acl-days-input"
              value={days}
              min={0}
              max={365}
              onChange={(e) => setDays(Math.max(0, Math.min(365, Number(e.target.value) || 0)))}
            />
            <input
              type="range"
              className="acl-slider"
              min={0}
              max={270}
              value={Math.min(days, 270)}
              onChange={(e) => setDays(Number(e.target.value))}
            />
            <span className="acl-days-suffix">0–270+ days</span>
          </div>

          <div className="acl-track-wrap">
            <div className="acl-track">
              {PHASES.map((p) => (
                <div
                  key={p.id}
                  className="acl-seg"
                  style={{ width: `${segWidth}%`, background: p.color, opacity: p.id <= activePhaseIndex ? 0.9 : 0.35 }}
                />
              ))}
              <div className="acl-marker ghost" style={{ left: `${timeMarkerPos}%` }} title="Time-expected position" />
              <div className="acl-marker solid" style={{ left: `${criteriaMarkerPos}%` }} title="Criteria-cleared position" />
            </div>
            <div className="acl-seg-labels">
              {PHASES.map((p) => (
                <div key={p.id} className="acl-seg-label" style={{ width: `${segWidth}%` }}>
                  {p.short}
                </div>
              ))}
            </div>
          </div>

          <div className="acl-legend">
            <div className="acl-legend-item">
              <span className="acl-legend-dot" style={{ border: "2px dashed var(--ink-muted)" }} />
              Where the calendar expects this patient
            </div>
            <div className="acl-legend-item">
              <span className="acl-legend-dot" style={{ background: "var(--ink)" }} />
              Where their met criteria actually place them
            </div>
          </div>

          <div className={`acl-status ${statusTone}`}>
            {statusLabel}
            {statusTone === "warn" && " — time has passed but clinical criteria aren't met yet. Don't progress by calendar alone."}
            {statusTone === "ahead" && " — criteria cleared faster than typical. Confirm findings before advancing."}
            {statusTone === "ok" && " — criteria and timeline are aligned."}
          </div>
        </div>

        <div className="acl-accordion">
          {PHASES.map((p) => {
            const isOpen = openPhase === p.id;
            const cleared = phaseFullyMet(p.id);
            const metCount = checked[p.id].filter(Boolean).length;
            return (
              <div className="acl-phase-card" key={p.id}>
                <button
                  className="acl-phase-head"
                  onClick={() => setOpenPhase(isOpen ? -1 : p.id)}
                  aria-expanded={isOpen}
                >
                  <div className="acl-phase-head-left">
                    <span className="acl-phase-dot" style={{ background: p.color }} />
                    <div>
                      <div className="acl-phase-name">{p.name}</div>
                      <div className="acl-phase-range">{p.rangeLabel} (typical)</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span className={`acl-phase-status ${cleared ? "cleared" : ""}`}>
                      {cleared ? "Criteria met" : `${metCount}/${p.criteria.length} met`}
                    </span>
                    <span className={`acl-chevron ${isOpen ? "open" : ""}`}>▾</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="acl-criteria-list">
                    {p.criteria.map((c, idx) => (
                      <label className="acl-criterion" key={idx}>
                        <input
                          type="checkbox"
                          checked={checked[p.id][idx]}
                          onChange={() => toggleCriterion(p.id, idx)}
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="acl-panel acl-flags-panel">
          <div className="acl-flags-title">Red flags — check any that apply</div>
          <p className="acl-flags-sub">
            Any flag below should pause phase progression regardless of days post-op or criteria status.
          </p>
          <div className="acl-flags-grid">
            {RED_FLAGS.map((f, idx) => (
              <label className="acl-flag-item" key={idx}>
                <input type="checkbox" checked={flags[idx]} onChange={() => toggleFlag(idx)} />
                {f}
              </label>
            ))}
          </div>
          {anyFlag && (
            <div className="acl-alert-banner">
              <span>⚠</span>
              <span>Flag raised — recommend reassessment with the surgical/PT team before progressing this patient further, independent of the timeline or criteria status above.</span>
            </div>
          )}
        </div>

        <div className="acl-footer">
          Built as a portfolio prototype demonstrating criterion-based ACL-R progression logic.
          Phase ranges and criteria reflect commonly cited evidence-informed frameworks (e.g. quad/hamstring
          limb symmetry index thresholds, hop test batteries, ACL-RSI) and are illustrative — individual
          protocols should always follow the treating surgeon's and clinic's specific guidelines.
        </div>
      </div>
    </div>
  );
}
