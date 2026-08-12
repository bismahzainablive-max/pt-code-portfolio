import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import AclNavigator from "./pages/AclNavigator.jsx";
import OutcomeScorer from "./pages/OutcomeScorer.jsx";
import RedFlagScreening from "./pages/RedFlagScreening.jsx";
import CaseloadDashboard from "./pages/CaseloadDashboard.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Overview" },
  { to: "/caseload", label: "Caseload Dashboard" },
  { to: "/acl", label: "ACL Navigator" },
  { to: "/outcomes", label: "Outcome Scorer" },
  { to: "/red-flags", label: "Red-Flag Screening" },
];

export default function App() {
  const location = useLocation();

  return (
    <div>
      <style>{`
        .nav-bar {
          display: flex;
          gap: 4px;
          padding: 14px 20px;
          border-bottom: 1px solid #2A343E;
          background: #10161B;
          position: sticky;
          top: 0;
          z-index: 20;
          overflow-x: auto;
        }
        .nav-item {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 13px;
          border-radius: 8px;
          text-decoration: none;
          white-space: nowrap;
          color: #8B96A0;
        }
        .nav-item.active { background: #1D2731; color: #EDEDE5; }
      `}</style>
      <nav className="nav-bar">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`nav-item ${location.pathname === item.to ? "active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/caseload" element={<CaseloadDashboard />} />
        <Route path="/acl" element={<AclNavigator />} />
        <Route path="/outcomes" element={<OutcomeScorer />} />
        <Route path="/red-flags" element={<RedFlagScreening />} />
      </Routes>
    </div>
  );
}
