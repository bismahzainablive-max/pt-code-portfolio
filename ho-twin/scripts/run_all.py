"""Run the full analysis: mechanics figure, trajectories + prior predictive, Sobol sensitivity,
Bayesian calibration/identifiability, and transfer metrics. Writes results/*.png and results/results.json.

    python scripts/run_all.py --stages mech,traj,sobol,calib
"""
import argparse, json, sys, time
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from hotwin import params as prm, regimes as rg, biology, mechanics as mech, sensitivity, calibration as cal, metrics

OUT = ROOT / "results"
OUT.mkdir(exist_ok=True)
RES_PATH = OUT / "results.json"
COL = {"immobilized": "#6b7280", "active": "#2a9d8f", "passive_clinical": "#264653",
       "passive_forced": "#e9a03b", "animal_forced": "#c8553d"}
plt.rcParams.update({"font.size": 9, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.grid": True, "grid.alpha": 0.25, "figure.dpi": 150})


def load():
    return json.loads(RES_PATH.read_text()) if RES_PATH.exists() else {}


def save(res):
    RES_PATH.write_text(json.dumps(res, indent=2))


def stage_mech(res):
    k2 = prm.NOMINAL["k2"]; cB = prm.NOMINAL["c_B"]
    fig, ax = plt.subplots(1, 2, figsize=(9, 3.6))
    tau = np.linspace(0, 14, 200)
    for B, c in zip([0, 0.25, 0.5], ["#264653", "#e9a03b", "#c8553d"]):
        ax[0].plot(mech.theta_slack(B, cB) + mech.delta_from_torque(tau, k2), tau, color=c, label=f"B = {B}")
    ax[0].set(xlabel="Elbow flexion angle (deg)", ylabel="Passive torque (N·m)",
              title="Passive torque–angle: ossification shifts the end-range")
    ax[0].legend(frameon=False)
    Bs = np.linspace(0, 1, 100)
    for n in ["active", "passive_clinical", "passive_forced", "animal_forced"]:
        r = rg.REGIMES[n]; R = r.arrays(100)
        e = mech.peak_strain(R["control"], R["tau"], R["delta0"], Bs, np.full(100, cB), np.full(100, k2))
        ax[1].plot(Bs, e, color=COL[n], label=r.label)
    ax[1].axhspan(*prm.BOUNDS["eps_th"], color="#999", alpha=0.18, label="prior range of damage threshold")
    ax[1].set(xlabel="Mineralized volume B", ylabel="Peak tissue strain",
              title="Torque-limited loading is B-independent;\nangle-targeted loading escalates")
    ax[1].legend(frameon=False, fontsize=7)
    fig.tight_layout(); fig.savefig(OUT / "fig1_mechanics.png"); plt.close(fig)
    res["strain_initial"] = {n: metrics.initial_peak_strain(r) for n, r in rg.REGIMES.items()}


def stage_traj(res, N=4000):
    names = list(rg.REGIMES)
    R1 = rg.stack([rg.REGIMES[n] for n in names]); nom = biology.simulate(prm.batch(n=len(names)), R1)
    rng = np.random.default_rng(1); P = prm.sample_prior(N, rng); pp = prm.batch(P, n=N)
    base = biology.simulate(pp, rg.REGIMES["immobilized"].arrays(N))["B_final"]
    delta, frac = {}, {}
    for n in names[1:]:
        d = biology.simulate(pp, rg.REGIMES[n].arrays(N))["B_final"] - base
        delta[n] = d; frac[n] = float(np.mean(d > 0.05))
    fig, ax = plt.subplots(1, 2, figsize=(9, 3.6))
    for i, n in enumerate(names):
        ax[0].plot(nom["t"], nom["B"][:, i], color=COL[n], label=rg.REGIMES[n].label, lw=1.8)
    ax[0].set(xlabel="Days post-injury", ylabel="Mineralized volume B", title="Nominal trajectories (assumed parameters)")
    ax[0].legend(frameon=False, fontsize=6.5)
    bp = ax[1].boxplot([delta[n] for n in names[1:]], vert=False, showfliers=False, patch_artist=True,
                       tick_labels=[n.replace("_", "\n") for n in names[1:]])
    for patch, n in zip(bp["boxes"], names[1:]):
        patch.set(facecolor=COL[n], alpha=0.6)
    ax[1].axvline(0, color="k", lw=0.8)
    ax[1].set(xlabel="Change in final B vs immobilization (prior predictive)", title="When does loading matter at all?")
    fig.tight_layout(); fig.savefig(OUT / "fig2_trajectories.png"); plt.close(fig)
    res["nominal_B_final"] = {n: float(b) for n, b in zip(names, nom["B_final"])}
    res["prior_predictive_frac_dB_gt_0.05"] = frac
    res["prior_predictive_dB_median"] = {n: float(np.median(delta[n])) for n in delta}


def stage_sobol(res, N=2048):
    names = ["passive_clinical", "passive_forced", "animal_forced"]
    out = {}
    for n in names:
        reg = rg.REGIMES[n]
        def f(X, reg=reg):
            p = prm.batch({k: X[:, j] for j, k in enumerate(prm.NAMES)}, n=len(X))
            return biology.simulate(p, reg.arrays(len(X)))["B_final"]
        t = time.time(); s = sobol_run = sensitivity.sobol_indices(f, prm.LO, prm.HI, N=N, seed=7)
        out[n] = {"S1": s["S1"].tolist(), "ST": s["ST"].tolist(), "ST_ci": s["ST_ci"].tolist()}
        print(f"  sobol {n}: {time.time()-t:.1f}s")
    order = np.argsort(-np.max([out[n]["ST"] for n in names], axis=0))
    fig, ax = plt.subplots(figsize=(8, 4.4)); h = 0.26
    for k, n in enumerate(names):
        st = np.array(out[n]["ST"])[order]; ci = np.array(out[n]["ST_ci"])[:, order]
        ax.barh(np.arange(len(order)) + (k - 1) * h, st, h, color=COL[n], label=rg.REGIMES[n].label,
                xerr=np.vstack([np.maximum(st - ci[0], 0), np.maximum(ci[1] - st, 0)]), error_kw=dict(lw=0.6))
    ax.set_yticks(np.arange(len(order))); ax.set_yticklabels([prm.NAMES[i] for i in order]); ax.invert_yaxis()
    ax.set(xlabel="Total-order Sobol index (outcome: final mineralized volume)", title="What drives the outcome depends on the loading regime")
    ax.legend(frameon=False, fontsize=7); fig.tight_layout(); fig.savefig(OUT / "fig3_sobol.png"); plt.close(fig)
    res["sobol"] = {"params": prm.NAMES, "N": N, **out}


TRUTH_BASE = dict(gamma=0.015, eta=0.5, k_m=0.14, k_d=0.28)   # baseline biology (k_m, k_d) fixed = assumed known
INFER = ["eps_th", "gamma", "eta"]
SCEN = {"threshold_low(0.055)": 0.055, "threshold_high(0.090)": 0.090}


def designs():
    g = [rg.Regime(f"graded_{t}Nm", mech.TORQUE, torque=t, cycle_s=6, cycles=20, sessions=2, t0=7, t1=90)
         for t in (1.5, 3.0, 5.0, 8.0, 12.0)]
    R = rg.REGIMES
    return [cal.Design("D1 clinical-only", [R["immobilized"], R["active"], R["passive_clinical"]]),
            cal.Design("D2 + animal forced", [R["immobilized"], R["active"], R["passive_clinical"], R["animal_forced"]]),
            cal.Design("D3 graded torque series", [R["immobilized"]] + g)]


def calib_one(res, si, di, iters, chains, burn):
    sname, eth = list(SCEN.items())[si]; D = designs()[di]
    lo = np.array([prm.BOUNDS[k][0] for k in INFER]); hi = np.array([prm.BOUNDS[k][1] for k in INFER])
    prior_sd = (hi - lo) / np.sqrt(12)
    clin, anim = rg.REGIMES["passive_clinical"], rg.REGIMES["animal_forced"]
    truth = {**TRUTH_BASE, "eps_th": eth}
    y, _ = cal.simulate_truth(D, truth, np.random.default_rng(100 + di))
    logp = cal.make_logpost(D, y, INFER, base=truth)
    t = time.time(); ch, acc = cal.demc(logp, lo, hi, C=chains, n_iter=iters, seed=11 + di)
    post = ch[burn:]; flat = post.reshape(-1, len(INFER))[::4]
    rh = [float(cal.split_rhat(post[:, :, j])) for j in range(len(INFER))]
    es = [float(cal.ess(post[:, :, j])) for j in range(len(INFER))]
    e = flat[:, 0]; ts = metrics.transfer_summary(e, clin, anim)
    np.save(OUT / f"post_{si}_{di}.npy", flat)
    res.setdefault("calibration", {"infer": INFER, "iters": iters, "chains": chains, "burn": burn, "runs": {}})
    res["calibration"]["runs"][f"{sname}|{D.name}"] = dict(
        accept=float(acc), rhat_max=max(rh), ess_min=min(es),
        eps_th_q=[float(v) for v in np.percentile(e, [5, 50, 95])], eps_th_truth=eth,
        contraction=[float(1 - flat[:, j].std() / prior_sd[j]) for j in range(len(INFER))],
        transfer=ts, seconds=time.time() - t)
    print(f"  {sname} | {D.name}: acc={acc:.2f} rhat_max={max(rh):.3f} ess_min={min(es):.0f} "
          f"eps_th 90%CI=[{np.percentile(e,5):.3f},{np.percentile(e,95):.3f}] contraction={1-e.std()/prior_sd[0]:.2f} "
          f"P(clin>th)={ts['p_clin_exceeds']:.2f} ({time.time()-t:.0f}s)")


def stage_calibfig(res):
    clin = rg.REGIMES["passive_clinical"]; ec = metrics.initial_peak_strain(clin)
    fig, axes = plt.subplots(2, 3, figsize=(10, 5), sharex=True)
    for si, (sname, eth) in enumerate(SCEN.items()):
        for di, D in enumerate(designs()):
            f = OUT / f"post_{si}_{di}.npy"
            if not f.exists():
                continue
            e = np.load(f)[:, 0]; ax = axes[si, di]
            ax.hist(e, bins=30, range=(0.04, 0.12), color="#264653", alpha=0.8, density=True)
            ax.axvline(eth, color="#c8553d", lw=1.5); ax.axvline(ec, color="#e9a03b", ls="--", lw=1.2)
            if si == 0: ax.set_title(D.name, fontsize=9)
            if di == 0: ax.set_ylabel(f"truth ε_th = {eth}\nposterior density")
            if si == 1: ax.set_xlabel("ε_th (strain)")
    fig.suptitle("Identifiability of the damage threshold ε_th  (red = truth, orange dashed = clinical peak strain)", fontsize=9.5)
    fig.tight_layout(); fig.savefig(OUT / "fig4_identifiability.png"); plt.close(fig)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stages", default="mech,traj,sobol,calib")
    ap.add_argument("--iters", type=int, default=1500); ap.add_argument("--chains", type=int, default=12)
    ap.add_argument("--burn", type=int, default=700); ap.add_argument("--runs", default="all"); ap.add_argument("--sobolN", type=int, default=2048)
    a = ap.parse_args(); res = load()
    for s in a.stages.split(","):
        t = time.time(); print(f"[{s}]")
        {"mech": lambda: stage_mech(res), "traj": lambda: stage_traj(res), "sobol": lambda: stage_sobol(res, a.sobolN),
         "calib": lambda: [calib_one(res, si, di, a.iters, a.chains, a.burn) for si in range(2) for di in range(3)
                           if a.runs == "all" or f"{si}{di}" in a.runs.split(",")],
         "calibfig": lambda: stage_calibfig(res)}[s]()
        save(res); print(f"[{s}] done in {time.time()-t:.1f}s")
