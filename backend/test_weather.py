import unittest
from datetime import date, timedelta
import httpx
from fastapi.testclient import TestClient
from .weather import WeatherService, WeatherUnavailable, normalize_weather
from . import main


def provider_data():
    dates = [(date(2026, 10, 17) + timedelta(days=i)).isoformat() for i in range(8)]
    return {
        'current': {'time': '2026-10-17T14:15', 'temperature_2m': 10},
        'hourly': {'time': ['2026-10-17T00:00', '2026-10-17T14:00'], 'soil_moisture_0_to_1cm': [0.1, 0.32]},
        'daily': {'time': dates, 'precipitation_sum': [1] * 7 + [100], 'temperature_2m_min': [None] * 8},
    }


class NormalizationTests(unittest.TestCase):
    def test_current_hour_and_seven_day_total(self):
        weather = normalize_weather(provider_data())
        self.assertEqual(weather['moisture'], 32)
        self.assertEqual(weather['rainfall'], 7)
        self.assertEqual(len(weather['days']), 7)
        self.assertIsNone(weather['days'][0]['min'])
        self.assertIsNone(weather['days'][0]['code'])

    def test_missing_values_are_not_zero_or_replaced_with_other_hours(self):
        data = provider_data()
        data['hourly']['time'] = ['2026-10-17T00:00']
        data['daily']['precipitation_sum'][2] = None
        weather = normalize_weather(data)
        self.assertIsNone(weather['rainfall'])
        self.assertIsNone(weather['moisture'])
        data['daily']['time'] = data['daily']['time'][:2]
        self.assertIsNone(normalize_weather(data)['rainfall'])

    def test_invalid_required_data_is_rejected(self):
        for value in (None, True, float('nan')):
            data = provider_data()
            data['current']['temperature_2m'] = value
            with self.assertRaises(WeatherUnavailable):
                normalize_weather(data)


class WeatherServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_default_cache_checks_provider_again_after_one_minute(self):
        now, calls = [0], []

        def handler(request):
            calls.append(request)
            return httpx.Response(200, json=provider_data())

        service = WeatherService(client_factory=lambda: httpx.AsyncClient(transport=httpx.MockTransport(handler)), clock=lambda: now[0])
        first = await service.get(43.7064, -79.3986)
        self.assertEqual(first['cacheSeconds'], 60)
        now[0] = 59
        self.assertTrue((await service.get(43.7064, -79.3986))['cached'])
        now[0] = 60
        self.assertFalse((await service.get(43.7064, -79.3986))['cached'])
        self.assertEqual(len(calls), 2)

    async def test_cache_expiry_bounds_and_failure(self):
        now, calls = [0], []
        failing = [False]

        def handler(request):
            calls.append(request)
            return httpx.Response(503) if failing[0] else httpx.Response(200, json=provider_data())

        service = WeatherService(client_factory=lambda: httpx.AsyncClient(transport=httpx.MockTransport(handler)),
                                 ttl=10, max_entries=1, clock=lambda: now[0])
        first = await service.get(50, -110)
        self.assertFalse(first['cached'])
        second = await service.get(50, -110)
        self.assertTrue(second['cached'])
        self.assertEqual(first['fetchedAt'], second['fetchedAt'])
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0].url.params['forecast_days'], '7')
        now[0] = 11
        failing[0] = True
        with self.assertRaises(WeatherUnavailable):
            await service.get(50, -110)
        failing[0] = False
        await service.get(51, -110)
        self.assertEqual(len(service.cache), 1)
        self.assertNotIn((50, -110), service.cache)


class WeatherApiTests(unittest.TestCase):
    def test_coordinates_and_unavailable_response(self):
        class UnavailableService:
            async def get(self, latitude, longitude):
                raise WeatherUnavailable('provider failed')
        original = main.weather_service
        main.weather_service = UnavailableService()
        try:
            with TestClient(main.app) as client:
                for data in ({'latitude': True, 'longitude': -110}, {'latitude': 90, 'longitude': -110},
                             {'latitude': 50, 'longitude': 10}, {'latitude': 50, 'longitude': -110, 'apikey': 'ignored'}):
                    self.assertEqual(client.post('/api/weather', json=data).status_code, 422)
                response = client.post('/api/weather', json={'latitude': 50, 'longitude': -110})
                self.assertEqual(response.status_code, 503)
                self.assertNotIn('temperature', response.json())
        finally:
            main.weather_service = original


if __name__ == '__main__':
    unittest.main()
