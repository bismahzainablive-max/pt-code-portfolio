"""Bayesian calibration + identifiability analysis on synthetic experiments.

A `Design` is a set of loading experiments with noisy observations of mineralized volume B
at given days. We infer a subset of parameters with an adaptive random-walk Metropolis sampler
(written from scratch; multi-chain, overdispersed starts, split-Rhat and ESS diagnostics).
Uniform priors = the parameter bounds in params.py.
"""
from dataclasses import dataclass
import numpy as np
from . import params as prm, regimes as rg, biology


@dataclass
class Design:
    name: str
    regimes: list
    obs_days: tuple = (30, 60, 90, 120)
    sigma: float = 0.03

    @property
    def J(self):
        return len(self.regimes)


def simulate_truth(design, truth, rng):
    """Synthetic noisy data (J, T) from known true parameters."""
    R = rg.stack(design.regimes)
    p = prm.batch(truth, n=design.J)
    B = biology.simulate(p, R, 120, 1.0)["B"]
    clean = B[list(design.obs_days)].T
    return clean + rng.normal(0, design.sigma, clean.shape), clean


def make_logpost(design, y_obs, infer, base):
    """Return logp(theta (C, d)) -> (C,) for the inferred parameter names `infer`."""
    J = design.J
    R1 = rg.stack(design.regimes)
    days = list(design.obs_days)

    def logp(theta):
        C = theta.shape[0]
        over = {k: v for k, v in base.items()}
        p = prm.batch(over, n=C * J)
        for j, name in enumerate(infer):
            p[name] = np.repeat(theta[:, j], J)
        B = biology.simulate(p, rg.repeat(R1, C), 120, 1.0)["B"][days]  # (T, C*J)
        pred = B.T.reshape(C, J, len(days))
        return -0.5 * np.sum((pred - y_obs[None]) ** 2, axis=(1, 2)) / design.sigma ** 2

    return logp


def metropolis(logp, lo, hi, C=4, n_iter=4000, seed=0, adapt=(400, 1000, 2000)):
    rng = np.random.default_rng(seed)
    lo, hi = np.asarray(lo, float), np.asarray(hi, float)
    d = len(lo)
    x = lo + (hi - lo) * rng.random((C, d))
    lp = logp(x)
    chain = np.empty((n_iter, C, d))
    L = np.linalg.cholesky(np.diag(((hi - lo) * 0.05) ** 2) * 2.38 ** 2 / d)
    acc = 0
    for it in range(n_iter):
        prop = x + rng.standard_normal((C, d)) @ L.T
        inb = np.all((prop >= lo) & (prop <= hi), axis=1)
        lpp = np.full(C, -np.inf)
        if inb.any():
            lpp[inb] = logp(prop[inb])
        ok = np.log(rng.random(C)) < (lpp - lp)
        x = np.where(ok[:, None], prop, x)
        lp = np.where(ok, lpp, lp)
        acc += ok.mean()
        chain[it] = x
        if it + 1 in adapt:
            pooled = chain[(it + 1) // 2: it + 1].reshape(-1, d)
            cov = np.cov(pooled.T) + 1e-10 * np.eye(d)
            L = np.linalg.cholesky(cov * 2.38 ** 2 / d)
    return chain, acc / n_iter


def split_rhat(ch):
    """ch: (n, C) draws of one scalar. Split-Rhat (Gelman et al.)."""
    n = ch.shape[0] // 2
    s = np.concatenate([ch[:n], ch[n:2 * n]], axis=1)
    W = s.var(axis=0, ddof=1).mean()
    Bv = n * s.mean(axis=0).var(ddof=1)
    return np.sqrt(((n - 1) / n * W + Bv / n) / W)


def ess(ch):
    """Effective sample size via FFT autocorrelation and Geyer's initial positive sequence."""
    n, C = ch.shape
    x = ch - ch.mean(axis=0)
    f = np.fft.rfft(x, n=2 * n, axis=0)
    acov = np.fft.irfft(f * np.conj(f), axis=0)[:n] / n
    rho = (acov.mean(axis=1)) / acov.mean(axis=1)[0]
    s = 0.0
    for k in range(1, n - 1, 2):
        pair = rho[k] + rho[k + 1]
        if pair < 0:
            break
        s += pair
    tau = 1 + 2 * (rho[0] * 0 + s)
    return n * C / max(tau, 1.0)


def demc(logp, lo, hi, C=16, n_iter=3000, seed=0, jitter=1e-3):
    """Differential-evolution MCMC (ter Braak 2006) with a split-population update.

    Chains are split into two halves; each half proposes from difference vectors of the OTHER half
    (held fixed during the update), which keeps the parallel update valid, as in emcee-style
    ensemble samplers. Handles correlated / ridge-shaped posteriors far better than a
    random-walk Metropolis. Every 10th iteration uses gamma=1 to allow mode jumps.
    """
    rng = np.random.default_rng(seed)
    lo, hi = np.asarray(lo, float), np.asarray(hi, float)
    d = len(lo)
    assert C % 2 == 0 and C >= 8
    x = lo + (hi - lo) * rng.random((C, d))
    lp = logp(x)
    groups = [np.arange(C // 2), np.arange(C // 2, C)]
    g0 = 2.38 / np.sqrt(2 * d)
    chain = np.empty((n_iter, C, d))
    acc = 0.0
    for it in range(n_iter):
        gam = 1.0 if it % 10 == 9 else g0
        for gi in (0, 1):
            idx, oth = groups[gi], groups[1 - gi]
            m = len(oth)
            ia = rng.integers(0, m, len(idx))
            ib = (ia + rng.integers(1, m, len(idx))) % m
            prop = x[idx] + gam * (x[oth[ia]] - x[oth[ib]]) + jitter * (hi - lo) * rng.standard_normal((len(idx), d))
            inb = np.all((prop >= lo) & (prop <= hi), axis=1)
            lpp = np.full(len(idx), -np.inf)
            if inb.any():
                lpp[inb] = logp(prop[inb])
            ok = np.log(rng.random(len(idx))) < (lpp - lp[idx])
            x[idx[ok]] = prop[ok]
            lp[idx[ok]] = lpp[ok]
            acc += ok.sum() / C
        chain[it] = x
    return chain, acc / (2 * n_iter)
