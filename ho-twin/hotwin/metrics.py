"""Load-regime transfer metrics: how far does the loading that produced the 'evidence' sit from
the loading used clinically, given what we know about the damage threshold eps_th?"""
import numpy as np
from . import mechanics as mech, biology, regimes as rg, params as prm


def initial_peak_strain(regime, k2=None):
    k2 = prm.NOMINAL["k2"] if k2 is None else k2
    R = regime.arrays(1)
    return float(mech.peak_strain(R["control"], R["tau"], R["delta0"], np.zeros(1), np.array([60.0]), np.array([k2]))[0])


def daily_dose(regime, eps_th, n_exp=None, k2=None):
    """Micro-damage dose per active day at B = 0 for an array of eps_th samples."""
    n_exp = prm.NOMINAL["n_exp"] if n_exp is None else n_exp
    eps_th = np.atleast_1d(eps_th).astype(float)
    eps_p = np.full_like(eps_th, initial_peak_strain(regime, k2))
    exc = mech.exceedance(eps_p, eps_th, np.full_like(eps_th, n_exp), np.full_like(eps_th, regime.cycle_s))
    return regime.cycles * regime.sessions * exc / biology.DOSE_REF


def transfer_summary(eps_th_samples, clinical, animal):
    """Posterior summaries: P(clinical strain > threshold) and transfer index = dose_clin / dose_animal."""
    e = np.asarray(eps_th_samples)
    ec, ea = initial_peak_strain(clinical), initial_peak_strain(animal)
    dc, da = daily_dose(clinical, e), daily_dose(animal, e)
    ti = dc / np.maximum(da, 1e-12)
    q = lambda a: [float(v) for v in np.percentile(a, [5, 50, 95])]
    return dict(eps_clin=ec, eps_animal=ea, p_clin_exceeds=float(np.mean(ec > e)),
                p_animal_exceeds=float(np.mean(ea > e)), transfer_index=q(ti))
