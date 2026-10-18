"""Check portable inference against GPU predictions in the target's units."""
import numpy as np


def validate_replay(expected, actual, *, rtol=1e-6, atol=1e-5):
    """Allow float32 rounding across BLAS/CUDA, while rejecting broken exports.

    At a test weight of 700 kg/m3 the tolerance is 0.00071 kg/m3.
    This is numerical agreement, not an estimate of predictive uncertainty.
    Both tolerances and the observed error are stored with the artifact.
    """
    expected = np.asarray(expected, dtype=np.float64).reshape(-1)
    actual = np.asarray(actual, dtype=np.float64).reshape(-1)
    if not expected.size or expected.shape != actual.shape:
        raise ValueError("Replay must contain equally sized, nonempty predictions")
    if not np.isfinite(expected).all() or not np.isfinite(actual).all():
        raise ValueError("Replay contains nonfinite predictions")
    error = np.abs(actual - expected)
    allowed = atol + rtol * np.abs(expected)
    if np.any(error > allowed):
        raise RuntimeError(f"Portable export mismatch: maximum error {error.max():.9g}")
    return {"rows": int(expected.size), "rtol": rtol, "atol": atol,
            "max_abs_error": float(error.max()),
            "max_tolerance_fraction": float((error / allowed).max())}
