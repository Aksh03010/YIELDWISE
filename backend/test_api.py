import unittest
from fastapi.testclient import TestClient
from . import main
from .inference import ModelRegistry
from .test_inference import artifact_fixture
import tempfile
from pathlib import Path
import json


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.original = main.registry
        self.temp = tempfile.TemporaryDirectory()
        self.artifact = artifact_fixture()
        Path(self.temp.name, 'maize_research_artifact.json').write_text(json.dumps(self.artifact))
        main.registry = ModelRegistry(self.temp.name)
        self.client = TestClient(main.app)
        self.payload = {'crop': 'corn', 'target': 'Yield_Mg_ha', 'inputs': self.artifact['targets']['Yield_Mg_ha']['replay_cases'][0]['input'], 'research_only': True}

    def tearDown(self):
        self.client.close()
        main.registry = self.original
        self.temp.cleanup()

    def test_catalog_and_verified_prediction_contract(self):
        self.assertEqual(self.client.get('/api/health').status_code, 200)
        catalog = self.client.get('/api/models').json()
        self.assertFalse(catalog['farm_forecasting_available'])
        result = self.client.post('/api/predict', json=self.payload)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()['value'], 4)
        self.assertTrue(result.json()['research_only'])
        self.assertEqual(len(result.json()['model_version']), 64)

    def test_unsupported_targets_and_invalid_inputs_have_no_result(self):
        for payload, status in (({**self.payload, 'crop': 'wheat'}, 409), ({**self.payload, 'target': 'premium_grade'}, 409),
                                ({**self.payload, 'research_only': False}, 422), ({**self.payload, 'inputs': {}}, 422),
                                ({**self.payload, 'inputs': {**self.payload['inputs'], 'Year': 2027}}, 422)):
            with self.subTest(payload=payload):
                result = self.client.post('/api/predict', json=payload)
                self.assertEqual(result.status_code, status)
                self.assertNotIn('value', result.json())


if __name__ == '__main__':
    unittest.main()
