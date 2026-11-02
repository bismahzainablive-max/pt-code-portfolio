"""Variance-based global sensitivity (Sobol indices), implemented from scratch.

Saltelli (2010) estimator for first-order S1 and Jansen estimator for total-order ST,
with a scrambled-Sobol quasi-random design and bootstrap confidence intervals.
Validated against the Ishigami function in tests/test_sensitivity.py.
"""
import numpy as np
from scipy.stats import qmc


def sobol_indices(f, lo, hi, N=1024, seed=0, n_boot=200):
    """f maps an (n, d) array of parameter rows to an (n,) output. N must be a power of 2."""
    lo, hi = np.asarray(lo, float), np.asarray(hi, float)
    d = len(lo)
    rng = np.random.default_rng(seed)
    U = qmc.Sobol(d=2 * d, scramble=True, seed=seed).random(N)
    A, B = lo + (hi - lo) * U[:, :d], lo + (hi - lo) * U[:, d:]
    fA, fB = f(A), f(B)
    fAB = np.empty((d, N))
    for i in range(d):
        ABi = A.copy()
        ABi[:, i] = B[:, i]
        fAB[i] = f(ABi)

    def est(idx):
        a, b, ab = fA[idx], fB[idx], fAB[:, idx]
        var = np.var(np.concatenate([a, b]), ddof=1)
        s1 = np.mean(b * (ab - a), axis=1) / var
        st = 0.5 * np.mean((a - ab) ** 2, axis=1) / var
        return s1, st

    s1, st = est(np.arange(N))
    boots = [est(rng.integers(0, N, N)) for _ in range(n_boot)]
    s1b = np.array([b[0] for b in boots]); stb = np.array([b[1] for b in boots])
    return dict(S1=s1, ST=st,
                S1_ci=np.percentile(s1b, [5, 95], axis=0), ST_ci=np.percentile(stb, [5, 95], axis=0))
