import copy
import json
from pathlib import Path
import tempfile
import unittest
from .inference import ModelRegistry


def artifact_fixture():
    inputs = {"Year": 2020, "latitude": 40, "longitude": -100, "weather_days_observed": 31, "weather_window_complete_31_days": 1}
    return {"research_only": True, "prepared_sha256": 'a' * 64, "protocol": "g2f-early-season-v1",
            "manifest": {"feature_columns": list(inputs), "geography": "Fixture test domain", "targets": {"Yield_Mg_ha": {"unit": "Mg/ha"}}},
            "targets": {"Yield_Mg_ha": {"features": list(inputs), "scaler": {"median": {k: 0 for k in inputs}, "mean": {k: 0 for k in inputs}, "std": {k: 1 for k in inputs}},
                "model": {"type": "mean", "constant": 4}, "unit": "Mg/ha", "test_metrics": {"MAE_in_target_units": 1, "site_season_counts": 2},
                "selected_candidate": "training_mean", "warning": "Test artifact", "replay_cases": [{"input": inputs, "expected_prediction": 4}]}}}


class RegistryTests(unittest.TestCase):
    def load(self, artifact):
        with tempfile.TemporaryDirectory() as folder:
            Path(folder, 'maize_research_artifact.json').write_text(json.dumps(artifact))
            return ModelRegistry(folder)

    def test_missing_or_corrupt_artifact_never_produces_a_prediction(self):
        with tempfile.TemporaryDirectory() as folder:
            registry = ModelRegistry(folder)
        self.assertFalse(registry.catalog()['farm_forecasting_available'])
        with self.assertRaises(LookupError):
            registry.predict('corn', 'Yield_Mg_ha', {})
        damaged = artifact_fixture()
        damaged['targets']['Yield_Mg_ha']['model']['constant'] = 99
        registry = self.load(damaged)
        self.assertNotIn('corn', registry.models)
        self.assertIn('corn', registry.errors)

    def test_schema_and_future_year_are_rejected(self):
        artifact = artifact_fixture(); registry = self.load(artifact)
        inputs = artifact['targets']['Yield_Mg_ha']['replay_cases'][0]['input']
        self.assertEqual(registry.predict('corn', 'Yield_Mg_ha', inputs)['value'], 4)
        for changed in ({**inputs, 'Year': 2027}, {**inputs, 'latitude': True}, {**inputs, 'extra': 1}, {**inputs, 'weather_days_observed': 29}):
            with self.subTest(inputs=changed), self.assertRaises(ValueError):
                registry.predict('corn', 'Yield_Mg_ha', changed)

    def test_required_provenance_and_replays(self):
        for edit in ('hash', 'protocol', 'cases', 'warning', 'root'):
            artifact = copy.deepcopy(artifact_fixture())
            if edit == 'hash': artifact['prepared_sha256'] = 'missing'
            elif edit == 'protocol': artifact['protocol'] = 'unknown'
            elif edit == 'cases': artifact['targets']['Yield_Mg_ha']['replay_cases'] = []
            elif edit == 'warning': del artifact['targets']['Yield_Mg_ha']['warning']
            else: artifact = []
            self.assertIn('corn', self.load(artifact).errors)


if __name__ == '__main__':
    unittest.main()
