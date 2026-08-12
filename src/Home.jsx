import React from "react";
import { Link } from "react-router-dom";

const PROTOTYPES = [
  {
    to: "/caseload",
    tag: "Flagship · System design",
    title: "Multi-Patient Caseload Dashboard",
    desc: "Combines phase tracking, outcome trending, red-flag status, and SOAP notes into one clinician view across a caseload — all derived from a single shared state model.",
  },
  {
    to: "/acl",
    tag: "Decision support",
    title: "ACL Rehab Phase Navigator",
    desc: "Criterion-based ACL-R progression — shows where the calendar expects a patient to be versus where their actual met criteria place them.",
  },
  {
    to: "/outcomes",
    tag: "Data & scoring",
    title: "Patient-Reported Outcome Auto-Scorer",
    desc: "Auto-scores LEFS, QuickDASH, ODI, and NPRS, then flags whether a change between visits is clinically meaningful (MCID) or measurement noise.",
  },
  {
    to: "/red-flags",
    tag: "Safety & triage",
    title: "Red-Flag Differential Screening",
    desc: "Structured intake screen across seven serious-pathology categories with explainable, transparent triage logic — reasoning stays visible, not hidden.",
  },
];

export default function Home() {
  return (
    <div className="home-wrap">
      <style>{`
        .home-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 56px 24px 80px;
          font-family: 'Inter', sans-serif;
        }
        .home-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8B96A0;
          margin-bottom: 12px;
        }
        .home-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: clamp(26px, 4vw, 38px);
          line-height: 1.15;
          margin-bottom: 14px;
          letter-spacing: -0.01em;
        }
        .home-sub {
          font-size: 14.5px;
          color: #8B96A0;
          max-width: 620px;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .home-note {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #E0C463;
          background: rgba(201,162,39,0.1);
          border: 1px solid rgba(201,162,39,0.35);
          padding: 7px 12px;
          border-radius: 6px;
          margin-bottom: 38px;
        }
        .home-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        .home-card {
          display: block;
          background: #171F26;
          border: 1px solid #2A343E;
          border-radius: 14px;
          padding: 22px;
          text-decoration: none;
          color: inherit;
        }
        .home-card-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          font-weight: 600;
          color: #4A90A4;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 10px;
        }
        .home-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 17px;
          margin-bottom: 8px;
        }
        .home-card-desc {
          font-size: 13.5px;
          color: #8B96A0;
          line-height: 1.55;
          margin-bottom: 12px;
        }
        .home-card-cta {
          font-size: 12.5px;
          font-weight: 600;
          color: #4A90A4;
        }
      `}</style>

      <div className="home-eyebrow">DPT + Code</div>
      <h1 className="home-title">Interactive clinical prototypes, built by a DPT student who codes</h1>
      <p className="home-sub">
        Four working prototypes exploring where clinical reasoning and software can actually help
        physical therapy practice. All use synthetic data — none of these are diagnostic tools,
        EMRs, or appropriate for real patient data.
      </p>
      <div className="home-note">Educational portfolio prototypes — not for clinical use.</div>

      <div className="home-grid">
        {PROTOTYPES.map((p) => (
          <Link className="home-card" to={p.to} key={p.to}>
            <div className="home-card-tag">{p.tag}</div>
            <div className="home-card-title">{p.title}</div>
            <div className="home-card-desc">{p.desc}</div>
            <div className="home-card-cta">Open prototype →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
