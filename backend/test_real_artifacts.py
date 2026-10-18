from pathlib import Path
import math
import unittest
from .inference import ModelRegistry, predict_target
from fastapi.testclient import TestClient
from . import main


class InstalledArtifactTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        folder = Path(__file__).parent / 'artifacts'
        if not folder.exists():
            raise unittest.SkipTest('Install the verified Colab artifact export to run model replays')
        cls.registry = ModelRegistry(folder)

    def test_all_35_saved_predictions_replay_from_json(self):
        self.assertEqual(self.registry.errors, {})
        self.assertEqual(set(self.registry.models), {'corn', 'soybeans'})
        count = 0
        for crop, registered in self.registry.models.items():
            for target in registered['artifact']['targets'].values():
                for case in target['replay_cases']:
                    actual = predict_target(crop, target, case['input'], case.get('site_id'))
                    self.assertTrue(math.isclose(actual, case['expected_prediction'], rel_tol=1e-6, abs_tol=1e-5))
                    count += 1
        self.assertEqual(count, 35)

    def test_unsupported_quality_and_future_year_are_blocked(self):
        with self.assertRaises(LookupError):
            self.registry.predict('soybeans', 'protein_percent', {})
        target = self.registry.models['corn']['artifact']['targets']['Yield_Mg_ha']
        inputs = {**target['replay_cases'][0]['input'], 'Year': 2027}
        with self.assertRaises(ValueError):
            self.registry.predict('corn', 'Yield_Mg_ha', inputs)
        self.assertFalse(self.registry.catalog()['farm_forecasting_available'])

    def test_out_of_domain_soybean_replay_is_not_served_as_an_app_prediction(self):
        target = self.registry.models['soybeans']['artifact']['targets']['yield_t_ha']
        inputs = {**target['replay_cases'][0]['input'], 'planting_doy': target['training_bounds']['planting_doy']['max'] + 1}
        with self.assertRaises(ValueError):
            self.registry.predict('soybeans', 'yield_t_ha', inputs)

    def test_real_model_endpoint_and_built_deep_links(self):
        target = self.registry.models['corn']['artifact']['targets']['Yield_Mg_ha']
        case = target['replay_cases'][0]
        original = main.registry
        main.registry = self.registry
        try:
            with TestClient(main.app) as client:
                response = client.post('/api/predict', json={'crop': 'corn', 'target': 'Yield_Mg_ha',
                                       'inputs': case['input'], 'site_id': case.get('site_id'), 'research_only': True})
                self.assertEqual(response.status_code, 200)
                self.assertTrue(response.json()['research_only'])
                self.assertTrue(math.isclose(response.json()['value'], case['expected_prediction'], rel_tol=1e-6, abs_tol=1e-5))
                if main.dist.is_dir():
                    for route in ('/', '/outlook', '/planning', '/conditions'):
                        page = client.get(route)
                        self.assertEqual(page.status_code, 200)
                        self.assertIn('id="root"', page.text)
                    self.assertEqual(client.get('/api/not-a-route').status_code, 404)
                    self.assertNotIn('id="root"', client.get('/api/not-a-route').text)
        finally:
            main.registry = original


if __name__ == '__main__':
    unittest.main()
