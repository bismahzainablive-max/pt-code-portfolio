"""Loading regimes. Values are illustrative assumptions (see params.py disclaimer)."""
from dataclasses import dataclass
import numpy as np
from .mechanics import NONE, TORQUE, ANGLE


@dataclass(frozen=True)
class Regime:
    name: str
    control: int          # NONE / TORQUE / ANGLE
    torque: float = 0.0   # N.m   (TORQUE mode)
    delta0: float = 0.0   # deg beyond the initial slack angle (ANGLE mode)
    cycle_s: float = 6.0
    cycles: float = 0.0   # cycles per session
    sessions: float = 0.0 # sessions per day
    t0: float = 0.0       # start day
    t1: float = 0.0       # end day
    label: str = ""

    def arrays(self, n):
        f = lambda v: np.full(n, float(v))
        return dict(control=np.full(n, self.control), tau=f(self.torque), delta0=f(self.delta0),
                    T=f(self.cycle_s), cycles=f(self.cycles), sessions=f(self.sessions),
                    t0=f(self.t0), t1=f(self.t1))


REGIMES = {
    "immobilized": Regime("immobilized", NONE, label="Immobilization (no motion)"),
    "active": Regime("active", TORQUE, torque=1.5, cycle_s=6, cycles=30, sessions=3, t0=7, t1=90,
                     label="Active ROM (muscle-torque-limited)"),
    "passive_clinical": Regime("passive_clinical", TORQUE, torque=3.0, cycle_s=6, cycles=10, sessions=2,
                               t0=7, t1=90, label="Passive ROM, torque-limited (clinical)"),
    # provenance: CPM within physiological arc does not progress HO (van Susante 1996, Acta Orthop Scand 67:450)
    "passive_forced": Regime("passive_forced", ANGLE, delta0=42.0, cycle_s=6, cycles=10, sessions=2,
                             t0=7, t1=90, label="Passive ROM pushed to target angle"),
    "animal_forced": Regime("animal_forced", ANGLE, delta0=48.0, cycle_s=2, cycles=30, sessions=2,
                            t0=1, t1=60, label="Animal-style forced loading (assumed)"),
    # provenance: Michelsson & Rauschning 1983 (Clin Orthop 176:265) - immobilization + daily forcible manipulation
}


def stack(regimes):
    """Stack a list of Regime into one dict of arrays (length = len(regimes))."""
    parts = [r.arrays(1) for r in regimes]
    return {k: np.concatenate([p[k] for p in parts]) for k in parts[0]}


def repeat(R, reps):
    """Repeat the stacked regime block `reps` times (regime index varies fastest)."""
    return {k: np.tile(v, reps) for k, v in R.items()}
