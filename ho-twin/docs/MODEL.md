# Model specification

v0.2: the loading-regime protocols and the biological timing window now carry literature provenance
(`hotwin/evidence.py`, graded `direct` / `scaled` / `conceptual`). The ODE rate constants and the damage
threshold `eps_th` remain illustrative assumptions — no primary-source values exist for them yet.

**Horizon:** default simulation horizon is 180 days (HO matures over 3–9 months, Casavant & Hastings 2006).
Calibration uses day-120 snapshots (`Design.obs_days = 30–120`, `days=120` passed explicitly) so the
identifiability analysis is unchanged from v0.1.

## States and equations (time in days)

| State | Meaning |
|---|---|
| I | inflammatory / osteogenic signal |
| P | recruited progenitor pool |
| O | osteogenic (committed) cells |
| B | mineralized volume fraction, 0 to 1 |

```
dI/dt = -k_I I + gamma * Dose(t, B)
dP/dt = r_P g(I) (1 - P) - d_P P - k_d P g(I)
dO/dt = k_d P g(I) / (1 + eta * S(t, B)) - d_O O
dB/dt = k_m O (1 - B)
g(I)  = I^2 / (K_I^2 + I^2)
```

## Mechanics and coupling

- Passive torque: `tau(delta) = K1 (exp(k2 delta) - 1)`, with `delta = theta - theta_slack(B)` and `theta_slack = 115 deg - c_B * B`.
- Tissue strain: `eps = 0.12 * delta[rad]`. Per-cycle waveform: `eps(t) = eps_peak sin^2(pi t / T)`.
- **Damage dose** per cycle: `integral of (max(0, eps(t) - eps_th) / 0.05)^n dt`. **Sub-threshold dose** `S`: time-weighted motion below `eps_th`.
- **Torque-limited** loading: `delta` depends only on torque, so strain is independent of B.
- **Angle-targeted** loading: `delta = delta0 + c_B B`, so strain grows as bone forms (positive-feedback pathway).

## Numerics

Batched fixed-step RK4 (dt = 1 day), vectorized across (parameter set, regime) pairs. Step error versus dt = 0.25 is below 3e-3 in B (tested).

## Parameters

| name | nominal | range | unit | meaning |
|---|---|---|---|---|
| `k_I` | 0.15 | 0.05 – 0.4 | 1/day | decay rate of inflammatory/osteogenic signal |
| `I0` | 1 | 0.5 – 1.5 | a.u. | injury-driven initial inflammatory signal |
| `gamma` | 0.01 | 0.002 – 0.04 | a.u. | signal generated per unit mechanical damage dose |
| `r_P` | 0.8 | 0.3 – 1.5 | 1/day | progenitor recruitment rate per unit signal |
| `d_P` | 0.2 | 0.05 – 0.5 | 1/day | progenitor loss rate |
| `k_d` | 0.3 | 0.1 – 0.6 | 1/day | osteogenic differentiation rate |
| `K_I` | 1 | 0.5 – 2 | a.u. | half-saturation of signal-driven differentiation |
| `d_O` | 0.1 | 0.03 – 0.3 | 1/day | osteogenic cell loss rate |
| `k_m` | 0.12 | 0.05 – 0.25 | 1/day | mineralization rate |
| `eps_th` | 0.07 | 0.04 – 0.12 | strain | tissue strain above which loading causes micro-damage |
| `n_exp` | 1.5 | 1 – 2.5 | - | damage-dose exponent on strain exceedance |
| `eta` | 0.3 | 0 – 1 | - | protective effect of sub-threshold motion on differentiation (0 = none) |
| `c_B` | 60 | 30 – 90 | deg | end-range ROM lost at full mineralization |
| `k2` | 0.06 | 0.04 – 0.09 | 1/deg | capsule torque-angle stiffness exponent |

Fixed constants: Hill exponent 2, P(0) = 0.05, K1 = 0.5 N·m, strain/length ratio 0.12, slack angle 115 deg, dose scales 10 and 300.

## Loading regimes (assumed)

| regime | control | peak strain at B = 0 |
|---|---|---|
| immobilized | none | 0 |
| active ROM | torque 1.5 N·m | 0.048 |
| passive, torque-limited (clinical) | torque 3 N·m | 0.068 |
| passive, pushed to target angle | angle +42 deg | 0.088 |
| animal-style forced loading | angle +48 deg, 2 s cycles | 0.101 |
