"""Parameter table.

IMPORTANT: every value below is an ILLUSTRATIVE ASSUMPTION chosen so the model behaves
plausibly. None is extracted from the literature (source="ASSUMED"). The point of the
project is to show how structure + uncertainty analysis expose what data would be needed,
not to claim these numbers are real. Replace them with literature-derived priors before
drawing any scientific conclusion.
"""
from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class Param:
    name: str
    nominal: float
    lo: float
    hi: float
    unit: str
    layer: str
    desc: str
    source: str = "ASSUMED"


PARAMS = [
    Param("k_I", 0.15, 0.05, 0.40, "1/day", "biology", "decay rate of inflammatory/osteogenic signal"),
    Param("I0", 1.0, 0.5, 1.5, "a.u.", "biology", "injury-driven initial inflammatory signal"),
    Param("gamma", 0.010, 0.002, 0.040, "a.u.", "coupling", "signal generated per unit mechanical damage dose"),
    Param("r_P", 0.80, 0.30, 1.50, "1/day", "biology", "progenitor recruitment rate per unit signal"),
    Param("d_P", 0.20, 0.05, 0.50, "1/day", "biology", "progenitor loss rate"),
    Param("k_d", 0.30, 0.10, 0.60, "1/day", "biology", "osteogenic differentiation rate"),
    Param("K_I", 1.0, 0.5, 2.0, "a.u.", "biology", "half-saturation of signal-driven differentiation"),
    Param("d_O", 0.10, 0.03, 0.30, "1/day", "biology", "osteogenic cell loss rate"),
    Param("k_m", 0.12, 0.05, 0.25, "1/day", "biology", "mineralization rate"),
    Param("eps_th", 0.07, 0.04, 0.12, "strain", "mechanics", "tissue strain above which loading causes micro-damage"),
    Param("n_exp", 1.5, 1.0, 2.5, "-", "mechanics", "damage-dose exponent on strain exceedance"),
    Param("eta", 0.3, 0.0, 1.0, "-", "coupling", "protective effect of sub-threshold motion on differentiation (0 = none)"),
    Param("c_B", 60.0, 30.0, 90.0, "deg", "mechanics", "end-range ROM lost at full mineralization"),
    Param("k2", 0.06, 0.04, 0.09, "1/deg", "mechanics", "capsule torque-angle stiffness exponent"),
]
NAMES = [p.name for p in PARAMS]
NOMINAL = {p.name: p.nominal for p in PARAMS}
LO = np.array([p.lo for p in PARAMS])
HI = np.array([p.hi for p in PARAMS])
BOUNDS = {p.name: (p.lo, p.hi) for p in PARAMS}


def batch(overrides=None, n=1):
    """Dict name -> array(n) at nominal values, with optional overrides (scalars or arrays)."""
    d = {k: np.full(n, v, dtype=float) for k, v in NOMINAL.items()}
    for k, v in (overrides or {}).items():
        d[k] = np.broadcast_to(np.asarray(v, dtype=float), (n,)).copy()
    return d


def sample_prior(n, rng, names=None):
    names = names or NAMES
    return {k: rng.uniform(*BOUNDS[k], size=n) for k in names}
