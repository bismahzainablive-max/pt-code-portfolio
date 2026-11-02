import unittest, numpy as np
from hotwin import params, regimes, biology, mechanics as mech


class TestModel(unittest.TestCase):
    def setUp(self):
        self.names = list(regimes.REGIMES)
        self.R = regimes.stack([regimes.REGIMES[n] for n in self.names])
        self.p = params.batch(n=len(self.names))

    def test_state_bounds_and_finite(self):
        out = biology.simulate(self.p, self.R)
        self.assertTrue(np.isfinite(out["traj"]).all())
        self.assertTrue((out["B"] >= -1e-9).all() and (out["B"] <= 1 + 1e-9).all())

    def test_B_monotone_nondecreasing(self):
        B = biology.simulate(self.p, self.R)["B"]
        self.assertTrue((np.diff(B, axis=0) >= -1e-9).all())

    def test_dose_ordering(self):
        out = biology.simulate(self.p, self.R)
        d = dict(zip(self.names, out["dose_cum"]))
        self.assertEqual(d["immobilized"], 0.0)
        self.assertGreater(d["animal_forced"], d["passive_forced"])
        B = dict(zip(self.names, out["B_final"]))
        self.assertGreater(B["animal_forced"], B["passive_forced"])
        self.assertGreater(B["passive_forced"], B["immobilized"])

    def test_rk4_step_convergence(self):
        a = biology.simulate(self.p, self.R, dt=1.0)["B_final"]
        b = biology.simulate(self.p, self.R, dt=0.25)["B_final"]
        self.assertLess(np.abs(a - b).max(), 3e-3)

    def test_torque_strain_independent_of_B_angle_strain_grows(self):
        k2, cB = np.array([0.06]), np.array([60.0])
        t = [mech.peak_strain(np.array([mech.TORQUE]), np.array([3.0]), np.array([0.0]), np.array([B]), cB, k2)[0] for B in (0, .5, 1)]
        a = [mech.peak_strain(np.array([mech.ANGLE]), np.array([0.0]), np.array([40.0]), np.array([B]), cB, k2)[0] for B in (0, .5, 1)]
        self.assertAlmostEqual(t[0], t[2], places=12)
        self.assertTrue(a[0] < a[1] < a[2])

    def test_torque_angle_roundtrip(self):
        d = mech.delta_from_torque(3.0, 0.06)
        self.assertAlmostEqual(float(mech.torque_from_delta(d, 0.06)), 3.0, places=9)

    def test_dose_zero_below_threshold(self):
        z = mech.exceedance(np.array([0.05]), np.array([0.07]), np.array([1.5]), np.array([6.0]))
        self.assertEqual(float(z[0]), 0.0)


if __name__ == "__main__":
    unittest.main()
