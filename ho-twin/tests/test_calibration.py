import unittest, numpy as np
from hotwin.calibration import metropolis, demc, split_rhat, ess


class TestMCMC(unittest.TestCase):
    def test_recovers_gaussian(self):
        mu, sd = np.array([0.3, -0.2]), np.array([0.5, 0.2])
        logp = lambda x: -0.5 * np.sum(((x - mu) / sd) ** 2, axis=1)
        ch, acc = metropolis(logp, [-3, -3], [3, 3], C=4, n_iter=6000, seed=3)
        post = ch[2000:].reshape(-1, 2)
        np.testing.assert_allclose(post.mean(0), mu, atol=0.06)
        np.testing.assert_allclose(post.std(0), sd, rtol=0.15)
        self.assertLess(split_rhat(ch[2000:, :, 0]), 1.05)
        self.assertGreater(ess(ch[2000:, :, 0]), 200)
        self.assertGreater(acc, 0.1)

    def test_demc_correlated_ridge(self):
        d = 5
        rho = 0.95
        S = np.full((d, d), rho) + (1 - rho) * np.eye(d)
        Si = np.linalg.inv(S)
        logp = lambda x: -0.5 * np.einsum("ij,jk,ik->i", x, Si, x)
        ch, acc = demc(logp, [-5] * d, [5] * d, C=16, n_iter=3000, seed=5)
        post = ch[1000:].reshape(-1, d)
        np.testing.assert_allclose(post.mean(0), 0, atol=0.15)
        np.testing.assert_allclose(post.std(0), 1.0, rtol=0.2)
        self.assertLess(max(split_rhat(ch[1000:, :, j]) for j in range(d)), 1.05)


if __name__ == "__main__":
    unittest.main()
