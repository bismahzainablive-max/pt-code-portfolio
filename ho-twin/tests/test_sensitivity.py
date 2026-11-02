import unittest, numpy as np
from hotwin.sensitivity import sobol_indices


def ishigami(X, a=7.0, b=0.1):
    return np.sin(X[:, 0]) + a * np.sin(X[:, 1]) ** 2 + b * X[:, 2] ** 4 * np.sin(X[:, 0])


class TestSobol(unittest.TestCase):
    def test_ishigami_analytic(self):
        r = sobol_indices(ishigami, [-np.pi] * 3, [np.pi] * 3, N=8192, seed=1, n_boot=20)
        np.testing.assert_allclose(r["S1"], [0.3139, 0.4424, 0.0], atol=0.03)
        np.testing.assert_allclose(r["ST"], [0.5576, 0.4424, 0.2437], atol=0.03)

    def test_additive_linear(self):
        f = lambda X: X[:, 0] + 2 * X[:, 1]
        r = sobol_indices(f, [0, 0], [1, 1], N=4096, seed=2, n_boot=20)
        np.testing.assert_allclose(r["S1"], [0.2, 0.8], atol=0.03)


if __name__ == "__main__":
    unittest.main()
