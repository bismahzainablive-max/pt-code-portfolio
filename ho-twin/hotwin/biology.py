"""Layers 2+3 - biology ODEs coupled to mechanics, integrated with a batched fixed-step RK4.

States (per simulation):  I  inflammatory / osteogenic signal
                          P  recruited progenitor pool
                          O  osteogenic (committed) cells
                          B  mineralized volume fraction in [0, 1]

  dI/dt = -k_I I + gamma * Dose(t, B)
  dP/dt = r_P g(I) (1 - P/Pmax) - d_P P - k_d P g(I)
  dO/dt = k_d P g(I) / (1 + eta S(t, B)) - d_O O
  dB/dt = k_m O (1 - B/Bmax)
  g(I)  = I^h / (K_I^h + I^h)

Dose = daily micro-damage dose from strain exceedance above eps_th (mechanics.exceedance);
S    = daily sub-threshold motion dose. Both depend on B for angle-targeted loading
(bidirectional coupling: biology -> mechanics -> biology).
All simulations are vectorized over a batch of (parameter set, regime) pairs.
"""
import numpy as np
from . import mechanics as mech

H = 2.0
P0 = 0.05
PMAX = 1.0
BMAX = 1.0
DOSE_REF = 10.0
S_REF = 300.0


def _rhs(t, y, p, R):
    I, P, O, B = y
    eps_p = mech.peak_strain(R["control"], R["tau"], R["delta0"], B, p["c_B"], p["k2"])
    active = ((t >= R["t0"]) & (t < R["t1"]) & (R["control"] > 0)).astype(float)
    cyc = R["cycles"] * R["sessions"] * active
    dose = cyc * mech.exceedance(eps_p, p["eps_th"], p["n_exp"], R["T"]) / DOSE_REF
    S = cyc * mech.subthreshold(eps_p, p["eps_th"], R["T"]) / S_REF
    g = I ** H / (p["K_I"] ** H + I ** H)
    dI = -p["k_I"] * I + p["gamma"] * dose
    dP = p["r_P"] * g * (1 - P / PMAX) - p["d_P"] * P - p["k_d"] * P * g
    dO = p["k_d"] * P * g / (1 + p["eta"] * S) - p["d_O"] * O
    dB = p["k_m"] * O * (1 - B / BMAX)
    return np.stack([dI, dP, dO, dB]), dose


def simulate(p, R, days=180, dt=1.0):
    """Default horizon 180 days: HO matures over 3-9 months (Casavant & Hastings 2006).
    Calibration passes days=120 explicitly with observations at days 30-120."""
    """Integrate a batch. p: dict name->array(N); R: dict of arrays(N). Returns dict of results."""
    N = len(R["T"])
    y = np.stack([p["I0"], np.full(N, P0), np.zeros(N), np.zeros(N)])
    steps = int(round(days / dt))
    traj = np.empty((steps + 1, 4, N))
    traj[0] = y
    dose_cum = np.zeros(N)
    t = 0.0
    for s in range(steps):
        k1, d1 = _rhs(t, y, p, R)
        k2_, d2 = _rhs(t + dt / 2, y + dt / 2 * k1, p, R)
        k3, d3 = _rhs(t + dt / 2, y + dt / 2 * k2_, p, R)
        k4, d4 = _rhs(t + dt, y + dt * k3, p, R)
        y = y + dt / 6 * (k1 + 2 * k2_ + 2 * k3 + k4)
        dose_cum += dt / 6 * (d1 + 2 * d2 + 2 * d3 + d4)
        t += dt
        traj[s + 1] = y
    B = traj[:, 3, :]
    return dict(t=np.arange(steps + 1) * dt, traj=traj, B=B, B_final=B[-1],
                rom_loss=p["c_B"] * B[-1], dose_cum=dose_cum)
