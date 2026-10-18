import copy
from datetime import date, timedelta
import json
from pathlib import Path
import unittest
import httpx
from fastapi.testclient import TestClient
from . import main
from .field_forecast import PARAMETER_UNITS, FieldDataUnavailable, PowerService, normalize_power


def nasa_fixture():
    days = [(date(2021, 5, 22) + timedelta(days=i)).strftime('%Y%m%d') for i in range(31)]
    return {'header': {'fill_value': -999, 'time_standard': 'LST'},
        'parameters': {key: {'units': 'MJ/m^2/day' if key == 'ALLSKY_SFC_PAR_TOT' else unit} for key, unit in PARAMETER_UNITS.items()},
        'properties': {'parameter': {key: {day: 10 for day in days} for key in PARAMETER_UNITS}}}


class FeatureTests(unittest.TestCase):
    def test_exact_window_coordinate_features_and_radiation_conversion(self):
        result = normalize_power(nasa_fixture(), 40, -105, date(2021, 5, 22))
        features = result['features']
        self.assertEqual(len(features), 69)
        self.assertEqual(features['latitude'], 40)
        self.assertEqual(features['PRECTOTCORR_sum'], 310)
        self.assertAlmostEqual(features['ALLSKY_SFC_PAR_TOT_mean'], 10e6 / 86400)
        self.assertEqual(result['source']['end'], '2021-06-21')
        self.assertEqual(result['source']['unit_conversions'][0]['to'], 'W/m^2')

    def test_missing_days_and_unknown_units_are_errors_not_training_median_fallbacks(self):
        for edit in ('missing', 'fill', 'units'):
            data = nasa_fixture()
            if edit == 'missing': del data['properties']['parameter']['T2M']['20210522']
            elif edit == 'fill': data['properties']['parameter']['T2M']['20210522'] = -999
            else: data['parameters']['T2M']['units'] = 'F'
            with self.assertRaises(FieldDataUnavailable):
                normalize_power(data, 40, -105, date(2021, 5, 22))


class PowerServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_cache_separates_locations_and_no_future_weather_is_fabricated(self):
        requests = []
        def handler(request):
            requests.append(request)
            return httpx.Response(200, json=nasa_fixture())
        service = PowerService(client_factory=lambda: httpx.AsyncClient(transport=httpx.MockTransport(handler)))
        first = await service.get(40, -105, date(2021, 5, 22))
        cached = await service.get(40, -105, date(2021, 5, 22))
        second = await service.get(41, -104, date(2021, 5, 22))
        self.assertFalse(first['source']['cached'])
        self.assertTrue(cached['source']['cached'])
        self.assertEqual(len(requests), 2)
        self.assertEqual(requests[1].url.params['latitude'], '41')
        self.assertNotEqual(first['features']['latitude'], second['features']['latitude'])
        with self.assertRaises(ValueError):
            await service.get(40, -105, date.today())
        self.assertEqual(len(requests), 2)


class FieldApiTests(unittest.TestCase):
    def setUp(self):
        self.original = main.power_service
        self.calls = []
        example = json.loads((Path(__file__).parent.parent / 'src/data/modelExamples.json').read_text())['corn']
        calls = self.calls
        class RecordedEnvironment:
            async def get(self, latitude, longitude, planting):
                calls.append((latitude, longitude, planting))
                return {'features': {**copy.deepcopy(example['inputs']), 'latitude': latitude, 'longitude': longitude, 'Year': planting.year},
                        'source': {'start': planting.isoformat(), 'end': (planting + timedelta(days=30)).isoformat(), 'days': 31}}
        main.power_service = RecordedEnvironment()
        self.client = TestClient(main.app)
        self.payload = {'crop': 'corn', 'latitude': 40.6498, 'longitude': -104.9955, 'planting_date': '2021-05-22', 'area_ha': 100, 'research_only': True}

    def tearDown(self):
        self.client.close()
        main.power_service = self.original

    def test_location_reaches_the_model_and_area_only_scales_production(self):
        a = self.client.post('/api/field-forecast', json=self.payload)
        b = self.client.post('/api/field-forecast', json={**self.payload, 'latitude': 42, 'longitude': -95})
        doubled = self.client.post('/api/field-forecast', json={**self.payload, 'area_ha': 200})
        self.assertEqual(a.status_code, 200)
        self.assertEqual(b.status_code, 200)
        first, second = a.json(), b.json()
        self.assertEqual(first['latitude'], self.payload['latitude'])
        self.assertTrue(first['location_driven'])
        self.assertNotEqual(first['predictions'][0]['value'], second['predictions'][0]['value'])
        self.assertAlmostEqual(doubled.json()['production_tonnes'], first['production_tonnes'] * 2)
        self.assertIn('Grain_Moisture', first['unavailable_targets'])
        self.assertFalse(any(value['target'] == 'Grain_Moisture' for value in first['predictions']))

    def test_invalid_requests_and_unsupported_crops_do_not_fetch_environment(self):
        for patch, status in (({'crop': 'soybeans'}, 409), ({'latitude': True}, 422), ({'planting_date': ''}, 422), ({'area_ha': 0}, 422)):
            self.assertEqual(self.client.post('/api/field-forecast', json={**self.payload, **patch}).status_code, status)
        self.assertEqual(self.calls, [])

    def test_new_season_is_explicitly_experimental_and_strict_trial_guard_remains(self):
        response = self.client.post('/api/field-forecast', json={**self.payload, 'planting_date': '2022-05-22'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['research_only'])
        self.assertTrue(any('2022' in warning for warning in response.json()['warnings']))


if __name__ == '__main__':
    unittest.main()
