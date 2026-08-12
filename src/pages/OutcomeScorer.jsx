import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const LEFS_ITEMS = [
  "Usual work, housework, or school activities",
  "Usual hobbies, recreational or sporting activities",
  "Getting into or out of the bath",
  "Walking between rooms",
  "Putting on shoes or socks",
  "Squatting",
  "Lifting an object, like a bag of groceries, from the floor",
  "Performing light activities around the home",
  "Performing heavy activities around the home",
  "Getting into or out of a car",
  "Walking 2 blocks",
  "Walking a mile",
  "Going up or down 10 stairs",
  "Standing for 1 hour",
  "Sitting for 1 hour",
  "Running on even ground",
  "Running on uneven ground",
  "Making sharp turns while running fast",
  "Hopping",
  "Rolling over in bed",
];
const DIFFICULTY_SCALE = ["Extreme difficulty / unable", "Quite a bit of difficulty", "Moderate difficulty", "A little difficulty", "No difficulty"];

const ODI_SECTIONS = [
  "Pain intensity",
  "Personal care (washing, dressing)",
  "Lifting",
  "Walking",
  "Sitting",
  "Standing",
  "Sleeping",
  "Sex life",
  "Social life",
  "Traveling",
];
const SEVERITY_SCALE = ["None", "Mild", "Moderate", "Marked", "Severe", "Total / unable"];

const QUICKDASH_ITEMS = [
  "Opening a tight or new jar",
  "Doing heavy household chores",
  "Carrying a bag of groceries or a briefcase",
  "Washing your back",
  "Using a knife to cut food",
  "Recreational activities requiring some force through the arm/shoulder/hand",
  "Usual social activities, limited by an arm, shoulder, or hand problem",
  "Usual work or daily activities, limited by an arm, shoulder, or hand problem",
  "Arm, shoulder, or hand pain",
  "Tingling (pins and needles) in arm, shoulder, or hand",
  "Sleep disturbed by pain in arm, shoulder, or hand",
];
const QUICKDASH_SCALE = ["No difficulty / none", "Mild", "Moderate", "Severe", "Unable / extreme"];

const MEASURES = [
  {
    id: "lefs",
    label: "LEFS",
    fullName: "Lower Extremity Functional Scale",
    type: "itemized",
    items: LEFS_ITEMS,
    scale: DIFFICULTY_SCALE,
    computeRaw: (a) => a.reduce((s, v) => s + (v || 0), 0),
    functionIndex: (raw) => (raw / 80) * 100,
    display: (raw) => `${raw}/80`,
    mcid: (9 / 80) * 100,
  },
  {
    id: "quickdash",
    label: "QuickDASH",
    fullName: "Quick Disabilities of the Arm, Shoulder & Hand",
    type: "itemized",
    items: QUICKDASH_ITEMS,
    scale: QUICKDASH_SCALE,
    computeRaw: (a) => {
      const values = a.map((v) => (v || 0) + 1);
      const n = values.length;
      const sum = values.reduce((s, v) => s + v, 0);
      return ((sum / n) - 1) * 25;
    },
    functionIndex: (raw) => 100 - raw,
    display: (raw) => `${raw.toFixed(0)}/100 disability`,
    mcid: 8,
  },
  {
    id: "odi",
    label: "ODI",
    fullName: "Oswestry Disability Index",
    type: "itemized",
    items: ODI_SECTIONS,
    scale: SEVERITY_SCALE,
    computeRaw: (a) => a.reduce((s, v) => s + (v || 0), 0),
    functionIndex: (raw) => 100 - (raw / 50) * 100,
    display: (raw) => `${((raw / 50) * 100).toFixed(0)}% disability`,
    mcid: 10,
  },
  {
    id: "nprs",
    label: "NPRS",
    fullName: "Numeric Pain Rating Scale",
    type: "single",
    min: 0,
    max: 10,
    computeRaw: (v) => v,
    functionIndex: (raw) => ((10 - raw) / 10) * 100,
    display: (raw) => `${raw}/10 pain`,
    mcid: 20,
  },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function Rater({ count, labels, value, onChange }) {
  return (
    <div className="om-rater">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          className={`om-rate-btn ${value === i ? "active" : ""}`}
          onClick={() => onChange(i)}
          aria-pressed={value === i}
          title={labels ? labels[i] : undefined}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

function TrendChart({ history, mcid, measureLabel }) {
  if (history.length === 0) {
    return <div className="om-chart-empty">No sessions saved yet for {measureLabel}. Save a session to start the trend.</div>;
  }
  const W = 640, H = 220, PAD_L = 42, PAD_R = 20, PAD_T = 16, PAD_B = 30;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const n = history.length;
  const xFor = (i) => (n === 1 ? PAD_L + plotW / 2 : PAD_L + (i / (n - 1)) * plotW);
  const yFor = (v) => PAD_T + plotH - (v / 100) * plotH;

  const points = history.map((h, i) => ({ ...h, x: xFor(i), y: yFor(h.functionIndex) }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="om-chart-svg" role="img" aria-label={`${measureLabel} function trend chart`}>
      {gridLines.map((g) => (
        <g key={g}>
          <line x1={PAD_L} x2={W - PAD_R} y1={yFor(g)} y2={yFor(g)} className="om-gridline" />
          <text x={PAD_L - 8} y={yFor(g) + 4} className="om-axis-label" textAnchor="end">{g}</text>
        </g>
      ))}
      <path d={pathD} className="om-line" fill="none" />
      {points.map((p, i) => {
        let dotClass = "neutral";
        if (i > 0) {
          const diff = p.functionIndex - points[i - 1].functionIndex;
          if (diff >= mcid) dotClass = "improve";
          else if (diff <= -mcid) dotClass = "decline";
        }
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5.5} className={`om-dot ${dotClass}`} />
            <text x={p.x} y={H - 8} className="om-axis-label" textAnchor="middle">{p.date.slice(5)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function OutcomeScorer() {
  const [tabId, setTabId] = useState("lefs");
  const [answers, setAnswers] = useState(() => {
    const init = {};
    MEASURES.forEach((m) => {
      init[m.id] = m.type === "itemized" ? new Array(m.items.length).fill(null) : null;
    });
    return init;
  });
  const [date, setDate] = useState(todayStr());
  const [histories, setHistories] = useState(() => {
    const init = {};
    MEASURES.forEach((m) => (init[m.id] = []));
    return init;
  });

  const measure = MEASURES.find((m) => m.id === tabId);
  const activeAnswer = answers[tabId];
  const history = histories[tabId];

  const complete = measure.type === "itemized" ? activeAnswer.every((a) => a !== null) : activeAnswer !== null;
  const answeredCount = measure.type === "itemized" ? activeAnswer.filter((a) => a !== null).length : activeAnswer !== null ? 1 : 0;
  const totalCount = measure.type === "itemized" ? measure.items.length : 1;

  const rawScore = complete ? measure.computeRaw(activeAnswer) : null;
  const functionIndex = rawScore !== null ? measure.functionIndex(rawScore) : null;

  const setItemAnswer = (idx, val) => {
    setAnswers((prev) => {
      const next = { ...prev, [tabId]: [...prev[tabId]] };
      next[tabId][idx] = val;
      return next;
    });
  };
  const setSingleAnswer = (val) => {
    setAnswers((prev) => ({ ...prev, [tabId]: val }));
  };

  const saveSession = () => {
    const entry = { date, raw: rawScore, display: measure.display(rawScore), functionIndex };
    setHistories((h) => ({ ...h, [tabId]: [...h[tabId], entry] }));
    setAnswers((prev) => ({
      ...prev,
      [tabId]: measure.type === "itemized" ? new Array(measure.items.length).fill(null) : null,
    }));
  };

  const lastTwo = history.slice(-2);
  let changeMsg = null;
  if (lastTwo.length === 2) {
    const diff = lastTwo[1].functionIndex - lastTwo[0].functionIndex;
    if (diff >= measure.mcid) changeMsg = { text: "Meaningful improvement since last session", tone: "improve" };
    else if (diff <= -measure.mcid) changeMsg = { text: "Meaningful decline since last session — review plan of care", tone: "decline" };
    else changeMsg = { text: "Change since last session is within measurement error (not clinically meaningful yet)", tone: "neutral" };
  }

  return (
    <div className="om-app">
      <style>{`
        .om-app {
          --bg: #10161B;
          --surface: #171F26;
          --surface-raised: #1D2731;
          --line: #2A343E;
          --ink: #EDEDE5;
          --muted: #8B96A0;
          --teal: #4A90A4;
          --red: #C0392B;
          --green: #6B8E4E;
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--ink);
          padding: 40px 22px 60px;
          min-height: 100%;
        }
        .om-app * { box-sizing: border-box; }
        .om-shell { max-width: 940px; margin: 0 auto; }

        .om-back {
          display: inline-block;
          font-size: 12.5px;
          color: var(--muted);
          text-decoration: none;
          margin-bottom: 18px;
        }
        .om-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 10px;
        }
        .om-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: clamp(24px, 4vw, 34px);
          margin: 0 0 10px;
          letter-spacing: -0.01em;
        }
        .om-sub { font-size: 14px; color: var(--muted); max-width: 640px; line-height: 1.55; margin: 0; }
        .om-disclaimer {
          display: inline-block;
          margin-top: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #E0C463;
          background: rgba(201,162,39,0.1);
          border: 1px solid rgba(201,162,39,0.35);
          padding: 7px 12px;
          border-radius: 6px;
        }

        .om-tabs { display: flex; gap: 8px; margin-top: 30px; flex-wrap: wrap; }
        .om-tab {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 16px;
          border-radius: 8px 8px 0 0;
          border: 1px solid var(--line);
          border-bottom: none;
          background: var(--bg);
          color: var(--muted);
          cursor: pointer;
        }
        .om-tab.active { background: var(--surface); color: var(--ink); }

        .om-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 0 12px 12px 12px; padding: 24px; }
        .om-panel + .om-panel { border-radius: 12px; margin-top: 20px; }
        .om-panel-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
        .om-panel-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; }
        .om-progress { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--muted); }

        .om-item { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
        .om-item:last-child { border-bottom: none; }
        .om-item-label { font-size: 13.5px; flex: 1; min-width: 220px; }
        .om-rater { display: flex; gap: 6px; }
        .om-rate-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-raised); font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; cursor: pointer; color: var(--ink); }
        .om-rate-btn.active { background: var(--teal); border-color: var(--teal); color: #fff; }
        .om-scale-key { font-size: 11px; color: var(--muted); margin-top: 14px; font-family: 'IBM Plex Mono', monospace; }

        .om-single-wrap { padding: 20px 0; text-align: center; }
        .om-single-label { font-size: 13.5px; color: var(--muted); margin-bottom: 14px; }
        .om-single-rater { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }

        .om-footer-row { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; flex-wrap: wrap; gap: 12px; }
        .om-date-input { font-family: 'IBM Plex Mono', monospace; font-size: 13px; border: 1px solid var(--line); border-radius: 6px; padding: 6px 10px; background: var(--surface-raised); color: var(--ink); }
        .om-save-btn { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 13.5px; padding: 10px 18px; border-radius: 8px; border: none; background: var(--teal); color: #fff; cursor: pointer; }
        .om-save-btn:disabled { background: var(--line); color: var(--muted); cursor: not-allowed; }

        .om-score-row { display: flex; gap: 24px; margin-top: 4px; flex-wrap: wrap; }
        .om-score-card { font-family: 'IBM Plex Mono', monospace; }
        .om-score-value { font-size: 22px; font-weight: 600; }
        .om-score-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }

        .om-chart-empty { font-size: 13px; color: var(--muted); padding: 30px 0; text-align: center; }
        .om-chart-svg { width: 100%; height: auto; }
        .om-gridline { stroke: var(--line); stroke-width: 1; }
        .om-axis-label { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; fill: var(--muted); }
        .om-line { stroke: var(--teal); stroke-width: 2.5; }
        .om-dot { stroke: var(--surface); stroke-width: 2; }
        .om-dot.neutral { fill: var(--teal); }
        .om-dot.improve { fill: var(--green); }
        .om-dot.decline { fill: var(--red); }

        .om-change-banner { margin-top: 14px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; }
        .om-change-banner.improve { background: rgba(107,142,78,0.12); color: #9BC17E; border: 1px solid rgba(107,142,78,0.35); }
        .om-change-banner.decline { background: rgba(192,57,43,0.12); color: #E88A80; border: 1px solid rgba(192,57,43,0.35); }
        .om-change-banner.neutral { background: rgba(139,150,160,0.1); color: var(--muted); border: 1px solid var(--line); }

        .om-footer-note { margin-top: 30px; font-size: 11px; color: var(--muted); line-height: 1.6; border-top: 1px solid var(--line); padding-top: 16px; }

        @media (max-width: 560px) {
          .om-panel { padding: 16px; }
          .om-rater { gap: 4px; }
          .om-rate-btn { width: 26px; height: 26px; font-size: 11px; }
        }
      `}</style>

      <div className="om-shell">
        <Link to="/" className="om-back">← All prototypes</Link>
        <div className="om-eyebrow">Prototype · Outcome Measure Auto-Scorer</div>
        <h1 className="om-title">Patient-Reported Outcome Auto-Scorer</h1>
        <p className="om-sub">
          Auto-scores four standard outcome measures using their published formulas, then flags
          whether a change between visits crosses the minimal clinically important difference (MCID)
          — or is just measurement noise.
        </p>
        <div className="om-disclaimer">
          Educational prototype — item wording abbreviated for demo purposes; scoring formulas follow
          standard structure for each instrument.
        </div>

        <div className="om-tabs">
          {MEASURES.map((m) => (
            <button key={m.id} className={`om-tab ${tabId === m.id ? "active" : ""}`} onClick={() => setTabId(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="om-panel">
          <div className="om-panel-head">
            <div className="om-panel-title">{measure.fullName}</div>
            <div className="om-progress">{answeredCount}/{totalCount} rated</div>
          </div>

          {measure.type === "itemized" ? (
            <>
              {measure.items.map((label, idx) => (
                <div className="om-item" key={idx}>
                  <div className="om-item-label">{label}</div>
                  <Rater count={measure.scale.length} labels={measure.scale} value={activeAnswer[idx]} onChange={(v) => setItemAnswer(idx, v)} />
                </div>
              ))}
              <div className="om-scale-key">{measure.scale.map((s, i) => `${i} = ${s}`).join("   ·   ")}</div>
            </>
          ) : (
            <div className="om-single-wrap">
              <div className="om-single-label">Current pain (0 = no pain, 10 = worst imaginable pain)</div>
              <div className="om-single-rater">
                <Rater count={11} value={activeAnswer} onChange={setSingleAnswer} />
              </div>
            </div>
          )}

          <div className="om-footer-row">
            <div className="om-score-row">
              <div className="om-score-card">
                <div className="om-score-value">{rawScore !== null ? measure.display(rawScore) : "—"}</div>
                <div className="om-score-label">Raw score</div>
              </div>
              <div className="om-score-card">
                <div className="om-score-value">{functionIndex !== null ? `${functionIndex.toFixed(0)}%` : "—"}</div>
                <div className="om-score-label">Function index</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="date" className="om-date-input" value={date} onChange={(e) => setDate(e.target.value)} />
              <button className="om-save-btn" disabled={!complete} onClick={saveSession}>Save session</button>
            </div>
          </div>
        </div>

        <div className="om-panel">
          <div className="om-panel-head">
            <div className="om-panel-title">Function trend — {measure.label}</div>
            <div className="om-progress">{history.length} session{history.length !== 1 ? "s" : ""} logged</div>
          </div>
          <TrendChart history={history} mcid={measure.mcid} measureLabel={measure.label} />
          {changeMsg && <div className={`om-change-banner ${changeMsg.tone}`}>{changeMsg.text}</div>}
        </div>

        <div className="om-footer-note">
          Function index is a unified 0–100 scale (higher = better) so measures with opposite raw-score
          directions (LEFS higher-is-better vs. ODI/QuickDASH/NPRS higher-is-worse) are visually
          comparable. MCID thresholds shown are commonly cited illustrative values, not
          instrument-specific clinical guidance.
        </div>
      </div>
    </div>
  );
}
