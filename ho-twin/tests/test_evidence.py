import unittest
from hotwin import evidence


class TestEvidence(unittest.TestCase):
    def test_entries_complete(self):
        for e in evidence.LITERATURE:
            self.assertTrue(e.source.strip(), e.key)
            self.assertIn(e.mapping, {"direct", "scaled", "conceptual"}, e.key)
            self.assertTrue(e.maps_to.strip(), e.key)
            self.assertGreaterEqual(e.year, 1900)

    def test_anchor_sanity(self):
        def get(k):
            return next(x for x in evidence.LITERATURE if x.key == k)
        lo, hi = (int(v) for v in get("HO_maturation").value.split()[0].split("-"))
        self.assertGreaterEqual(lo, 3)
        self.assertLessEqual(hi, 18)
        self.assertTrue(130 <= int(get("elbow_flexion_aROM").value.split()[0]) <= 160)
        mesm = float(get("mechanostat_MESm").value.split("-")[0])
        mesp = float(get("mechanostat_MESp").value.split()[0].lstrip("~"))
        self.assertLess(mesm, mesp)


if __name__ == "__main__":
    unittest.main()
