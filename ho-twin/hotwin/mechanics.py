"""Layer 1 - joint mechanics.

Planar elbow, capsule/soft-tissue passive torque-angle law with exponential stiffening:
    tau(delta) = K1 * (exp(k2 * delta) - 1),  delta = theta - theta_slack(B)  [deg]
Ossification shifts the slack angle (a mechanical block): theta_slack(B) = THETA0 - c_B * B.
Tissue strain at the block is  eps = RATIO * delta[rad].

Two control modes matter for the biology:
  torque-controlled : delta depends only on applied torque -> tissue strain independent of B
  angle-targeted    : therapist/apparatus pushes to a fixed target angle -> delta = delta0 + c_B*B,
                      so strain GROWS as ossification progresses (a positive-feedback pathway).
"""
import numpy as np

K1_NM = 0.5          # N.m
RATIO = 0.12         # moment-arm / reference-length ratio (assumed)
THETA0 = 115.0       # deg, slack angle with no ossification (assumed)
EPS_REF = 0.05       # strain scale used to normalize damage dose
_M = 48
_U = (np.arange(_M) + 0.5) * np.pi / _M
_S2 = np.sin(_U) ** 2  # cycle waveform eps(t) = eps_peak * sin^2(pi t / T)

NONE, TORQUE, ANGLE = 0, 1, 2


def delta_from_torque(tau, k2):
    return np.log1p(np.asarray(tau, float) / K1_NM) / k2


def torque_from_delta(delta, k2):
    return K1_NM * np.expm1(k2 * np.asarray(delta, float))


def strain_from_delta(delta):
    return RATIO * np.deg2rad(delta)


def theta_slack(B, c_B):
    return THETA0 - c_B * B


def peak_strain(control, tau, delta0, B, c_B, k2):
    """Peak tissue strain per cycle for a batch of states."""
    d_torque = delta_from_torque(tau, k2)
    d_angle = np.maximum(delta0 + c_B * B, 0.0)
    delta = np.where(control == TORQUE, d_torque, np.where(control == ANGLE, d_angle, 0.0))
    return strain_from_delta(delta)


def exceedance(eps_p, eps_th, n, T):
    """Integral over one cycle of (max(0, eps(t) - eps_th) / EPS_REF)^n  [seconds]."""
    eps = eps_p[:, None] * _S2[None, :]
    x = np.maximum(eps - eps_th[:, None], 0.0) / EPS_REF
    return T * np.mean(x ** n[:, None], axis=1)


def subthreshold(eps_p, eps_th, T):
    """Time-weighted sub-threshold motion per cycle, normalized to eps_th [seconds]."""
    eps = eps_p[:, None] * _S2[None, :]
    return T * np.mean(np.minimum(eps, eps_th[:, None]) / eps_th[:, None], axis=1)
