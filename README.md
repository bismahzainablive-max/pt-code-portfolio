# DPT + Code — Interactive Clinical Prototypes

A small collection of interactive prototypes exploring where physical therapy practice and
software intersect. Built as a final-year DPT student who also codes, as a portfolio piece for
health-tech and clinic-facing dev work.

**Live demo:** `https://<your-username>.github.io/pt-code-portfolio/` (live once deployed — see below)

All prototypes use **synthetic data only**. Nothing here is a diagnostic tool, an EMR, or
appropriate for real patient data — see the in-app disclaimers on every page.

---

## Prototypes

### 1. Multi-Patient Caseload Dashboard *(flagship)*
Combines criterion-vs-calendar phase tracking, outcome-measure trending, red-flag status, and
SOAP notes into one clinician-facing view across a 6-patient caseload. Toggling a red flag or
adjusting a milestone for one patient live-updates their status dot in the sidebar *and* the
caseload-wide summary counters — everything derives from one shared state model rather than being
tracked separately per view.

### 2. ACL Rehab Phase Navigator
Visualizes the gap between where a patient's post-op day count says they *should* be and where
their actual met criteria place them — the core clinical idea that rehab should progress by
criteria, not by the calendar.

### 3. Patient-Reported Outcome Auto-Scorer
Auto-scores LEFS, QuickDASH, ODI, and NPRS using their published scoring formulas, then classifies
each score change against the Minimal Clinically Important Difference (MCID) so progress notes
reflect meaningful change rather than test-retest noise.

### 4. Red-Flag Differential Screening Tool
A structured intake screen across seven serious-pathology categories (cauda equina, cardiovascular,
vascular, fracture, malignancy, infection, progressive neuro) with severity-weighted, explainable
triage logic — the reasoning behind each recommendation stays visible as chips rather than hidden
in a black box.

---

## Skills demonstrated

**Technical:** React (hooks), component architecture, multi-entity/derived state management,
cross-component reactivity, custom SVG data visualization, client-side routing (HashRouter),
responsive CSS, form handling.

**Clinical/domain:** criterion-based rehab progression, standardized outcome measure scoring,
MCID interpretation, red-flag differential screening, SOAP documentation structure.

**Product:** system design (unifying several sub-tools into one data model), explainable/
transparent UI for clinical reasoning, realistic scoping (synthetic data, no PHI, HIPAA-conscious
design).

---

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Building for production

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

---

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and
deploys automatically on every push to `main`. To turn it on:

1. **Push this project to a new GitHub repo** named `pt-code-portfolio` (see "First-time setup"
   below if you haven't yet). If you use a different repo name, update `base` in
   `vite.config.js` to match it exactly first.
2. In your repo, go to **Settings → Pages**, and under "Build and deployment", set **Source** to
   **GitHub Actions**.
3. Commit and push. Check the **Actions** tab — once the workflow finishes, your site is live at
   `https://<your-username>.github.io/pt-code-portfolio/`.

Every future push to `main` redeploys automatically — no manual build/upload step needed.

### First-time setup (if you haven't pushed to GitHub yet)

From inside this project folder:

```bash
git init
git add .
git commit -m "Initial commit: DPT + code prototype portfolio"
git branch -M main
git remote add origin https://github.com/<your-username>/pt-code-portfolio.git
git push -u origin main
```

Then follow steps 2–3 above.

---

## Project structure

```
src/
  pages/
    Home.jsx                 landing page linking to all four prototypes
    AclNavigator.jsx
    OutcomeScorer.jsx
    RedFlagScreening.jsx
    CaseloadDashboard.jsx
  App.jsx                    routes + persistent nav bar
  main.jsx                   entry point (HashRouter, so GitHub Pages needs no rewrite rules)
  index.css                  base reset + font imports
.github/workflows/deploy.yml auto-build + deploy to GitHub Pages
```
