import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const CATEGORIES = [
  {
    id: "caudaEquina",
    label: "Cauda Equina",
    urgency: "emergency",
    items: [
      "Saddle anesthesia",
      "New bowel or bladder dysfunction (retention or incontinence)",
      "Bilateral leg weakness or numbness",
      "Sudden onset of severe low back pain with the above findings",
    ],
  },
  {
    id: "cardiovascular",
    label: "Cardiovascular",
    urgency: "emergency",
    items: [
      "Chest pain, pressure, or tightness with exertion",
      "Pain radiating to jaw, arm, or between shoulder blades",
      "Shortness of breath disproportionate to activity",
      "Dizziness, diaphoresis, or nausea accompanying symptoms",
    ],
  },
  {
    id: "vascular",
    label: "Vascular",
    urgency: "urgent",
    items: [
      "Unilateral leg swelling with calf pain (possible DVT)",
      "Pulsatile abdominal mass",
      "Absent or diminished peripheral pulses",
      "Sudden onset of a cold, pale, painful limb",
    ],
  },
  {
    id: "fracture",
    label: "Fracture / Trauma",
    urgency: "urgent",
    items: [
      "Recent significant trauma with focal bony tenderness",
      "Age over 50 with minor trauma and new severe pain",
      "Known osteoporosis with new spinal pain",
      "Inability to bear weight after injury",
    ],
  },
  {
    id: "malignancy",
    label: "Malignancy",
    urgency: "urgent",
    items: [
      "Unexplained weight loss",
      "Prior history of cancer",
      "Night pain unrelieved by rest or position change",
      "Age over 50 with new, unexplained musculoskeletal pain",
    ],
  },
  {
    id: "infection",
    label: "Infection",
    urgency: "urgent",
    items: [
      "Fever or chills accompanying musculoskeletal symptoms",
      "Recent infection, IV drug use, or immunosuppression",
      "Localized warmth, redness, and swelling",
      "Recent spinal procedure or injection",
    ],
  },
  {
    id: "progressiveNeuro",
    label: "Progressive Neurological",
    urgency: "urgent",
    items: [
      "Progressive weakness over days to weeks",
      "New gait disturbance or coordination loss",
      "Signs of upper motor neuron involvement (hyperreflexia, clonus)",
      "Rapidly worsening symptoms despite treatment",
    ],
  },
];

function initState() {
  const state = {};
  CATEGORIES.forEach((c) => (state[c.id] = new Array(c.items.length).fill(false)));
  return state;
}

export default function RedFlagScreening() {
  const [checked, setChecked] = useState(initState);

  const toggle = (catId, idx) => {
    setChecked((prev) => {
      const next = { ...prev, [catId]: [...prev[catId]] };
      next[catId][idx] = !next[catId][idx];
      return next;
    });
  };

  const triggered = useMemo(() => {
    const list = [];
    CATEGORIES.forEach((c) => {
      c.items.forEach((item, idx) => {
        if (checked[c.id][idx]) list.push({ category: c.label, urgency: c.urgency, item });
      });
    });
    return list;
  }, [checked]);

  const emergencyCount = triggered.filter((t) => t.urgency === "emergency").length;
  const urgentCount = triggered.filter((t) => t.urgency === "urgent").length;

  let recLabel = "No red flags identified — proceed with routine PT evaluation";
  let recTone = "clear";
  if (emergencyCount >= 1) {
    recLabel = "Emergency — refer immediately (do not proceed with routine PT evaluation)";
    recTone = "emergency";
  } else if (urgentCount >= 2) {
    recLabel = "Urgent referral recommended before proceeding with treatment";
    recTone = "urgent";
  } else if (urgentCount === 1) {
    recLabel = "Monitor closely — consider referral or physician consult";
    recTone = "watch";
  }

  const totalChecked = triggered.length;

  return (
    <div className="rf-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .rf-app {
          --bg: #10161B; --surface: #171F26; --surface-raised: #1D2731; --line: #2A343E;
          --ink: #EDEDE5; --muted: #8B96A0;
          --emergency: #C0392B; --urgent: #C9A227; --watch: #4A90A4; --clear: #6B8E4E;
          font-family: 'Inter', sans-serif; background: var(--bg); color: var(--ink);
          padding: 40px 22px 60px; min-height: 100%;
        }
        .rf-app * { box-sizing: border-box; }
        .rf-shell { max-width: 900px; margin: 0 auto; }
        .rf-back { display: inline-block; font-size: 12.5px; color: var(--muted); text-decoration: none; margin-bottom: 18px; }
        .rf-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
        .rf-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: clamp(24px, 4vw, 34px); margin: 0 0 10px; letter-spacing: -0.01em; }
        .rf-sub { font-size: 14px; color: var(--muted); max-width: 640px; line-height: 1.55; margin: 0; }
        .rf-disclaimer { display: inline-block; margin-top: 14px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #E0C463; background: rgba(201,162,39,0.1); border: 1px solid rgba(201,162,39,0.35); padding: 7px 12px; border-radius: 6px; }

        .rf-status-banner {
          margin-top: 28px; padding: 18px 20px; border-radius: 12px;
          font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15.5px;
          display: flex; align-items: center; gap: 12px;
        }
        .rf-status-banner.clear { background: rgba(107,142,78,0.12); color: #9BC17E; border: 1px solid rgba(107,142,78,0.35); }
        .rf-status-banner.watch { background: rgba(74,144,164,0.12); color: #7FC1D6; border: 1px solid rgba(74,144,164,0.35); }
        .rf-status-banner.urgent { background: rgba(201,162,39,0.12); color: #E0C463; border: 1px solid rgba(201,162,39,0.35); }
        .rf-status-banner.emergency { background: rgba(192,57,43,0.14); color: #E88A80; border: 1px solid rgba(192,57,43,0.4); }

        .rf-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 14px; margin-top: 22px; }
        .rf-cat-card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
        .rf-cat-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .rf-cat-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .rf-cat-dot.emergency { background: var(--emergency); }
        .rf-cat-dot.urgent { background: var(--urgent); }
        .rf-cat-name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 14px; }
        .rf-cat-urgency { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-left: auto; }
        .rf-item { display: flex; align-items: flex-start; gap: 9px; font-size: 13px; line-height: 1.5; padding: 6px 0; cursor: pointer; }
        .rf-item input { margin-top: 3px; accent-color: var(--emergency); }

        .rf-reasoning { margin-top: 26px; }
        .rf-reasoning-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 14.5px; margin-bottom: 12px; }
        .rf-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .rf-chip { display: flex; flex-direction: column; gap: 2px; background: var(--surface-raised); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; font-size: 12px; max-width: 320px; }
        .rf-chip-cat { font-family: 'IBM Plex Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .rf-chip.emergency .rf-chip-cat { color: var(--emergency); }
        .rf-chip.urgent .rf-chip-cat { color: var(--urgent); }
        .rf-chip-text { color: var(--ink); line-height: 1.4; }
        .rf-empty-note { font-size: 12.5px; color: var(--muted); margin-top: 26px; }

        .rf-footer { margin-top: 32px; font-size: 11px; color: var(--muted); line-height: 1.6; border-top: 1px solid var(--line); padding-top: 16px; }
      `}</style>

      <div className="rf-shell">
        <Link to="/" className="rf-back">← All prototypes</Link>
        <div className="rf-eyebrow">Prototype · Safety & Triage</div>
        <h1 className="rf-title">Red-Flag Differential Screening</h1>
        <p className="rf-sub">
          Structured intake screen across seven serious-pathology categories. The triage logic stays
          visible as reasoning chips below — nothing is hidden in a black-box score.
        </p>
        <div className="rf-disclaimer">
          Educational prototype — a screening aid, not a diagnostic tool. Categories and triage
          thresholds are illustrative, not a validated clinical instrument.
        </div>

        <div className={`rf-status-banner ${recTone}`}>
          {recTone === "emergency" && "🚨 "}
          {recTone === "urgent" && "⚠ "}
          {recLabel}
        </div>

        <div className="rf-grid">
          {CATEGORIES.map((c) => (
            <div className="rf-cat-card" key={c.id}>
              <div className="rf-cat-head">
                <span className={`rf-cat-dot ${c.urgency}`} />
                <span className="rf-cat-name">{c.label}</span>
                <span className="rf-cat-urgency">{c.urgency}</span>
              </div>
              {c.items.map((item, idx) => (
                <label className="rf-item" key={idx}>
                  <input type="checkbox" checked={checked[c.id][idx]} onChange={() => toggle(c.id, idx)} />
                  {item}
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="rf-reasoning">
          <div className="rf-reasoning-title">Reasoning behind this recommendation ({totalChecked} flag{totalChecked !== 1 ? "s" : ""})</div>
          {totalChecked === 0 ? (
            <div className="rf-empty-note">No items checked yet — check any findings above to see the reasoning trail here.</div>
          ) : (
            <div className="rf-chips">
              {triggered.map((t, i) => (
                <div className={`rf-chip ${t.urgency}`} key={i}>
                  <span className="rf-chip-cat">{t.category}</span>
                  <span className="rf-chip-text">{t.item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rf-footer">
          Built as a portfolio prototype demonstrating explainable clinical triage logic: any
          emergency-category item flags immediate referral; two or more urgent-category items flag
          urgent referral; a single urgent item flags close monitoring. The reasoning trail stays
          visible rather than collapsing to an opaque score.
        </div>
      </div>
    </div>
  );
}
