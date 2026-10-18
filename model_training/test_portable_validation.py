import unittest
import numpy as np
from portable_validation import validate_replay


class ReplayTests(unittest.TestCase):
    def test_accepts_observed_float32_rounding_in_test_weight(self):
        expected = np.array([700], dtype=np.float32)
        actual = np.nextafter(expected, np.float32(np.inf))
        result = validate_replay(expected, actual)
        self.assertEqual(result['rows'], 1)
        self.assertGreater(result['max_abs_error'], 1e-5)
        self.assertLess(result['max_tolerance_fraction'], 1)

    def test_rejects_material_export_errors(self):
        with self.assertRaises(RuntimeError):
            validate_replay([3.5, 700], [3.5, 700.01])

    def test_rejects_nonfinite_empty_and_shape_mismatch(self):
        for expected, actual in (([1], [float('nan')]), ([], []), ([1, 2], [1])):
            with self.subTest(expected=expected), self.assertRaises(ValueError):
                validate_replay(expected, actual)


if __name__ == '__main__':
    unittest.main()
