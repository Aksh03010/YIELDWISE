"""Coordinate-based weather retrieval with bounded, timestamped server caching."""
from collections import OrderedDict
from datetime import datetime, timezone
import math
import os
import time
import httpx


class WeatherUnavailable(Exception):
    pass


def finite(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) else None


def normalize_weather(data):
    current, daily, hourly = data.get('current') or {}, data.get('daily') or {}, data.get('hourly') or {}
    dates, model_time = daily.get('time'), current.get('time')
    if finite(current.get('temperature_2m')) is None or not isinstance(model_time, str) or not isinstance(dates, list) or not dates:
        raise WeatherUnavailable('Weather provider returned incomplete data')
    def at(name, index):
        values = daily.get(name)
        return finite(values[index]) if isinstance(values, list) and index < len(values) else None
    days = []
    for index, date in enumerate(dates[:7]):
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except (ValueError, TypeError):
            raise WeatherUnavailable('Weather provider returned invalid dates') from None
        days.append({'date': date, 'max': at('temperature_2m_max', index), 'min': at('temperature_2m_min', index),
                     'rain': at('precipitation_sum', index), 'code': at('weather_code', index)})
    hours = hourly.get('time') or []
    hour = next((index for index, value in enumerate(hours) if isinstance(value, str) and value[:13] == model_time[:13]), -1)
    moisture_values = hourly.get('soil_moisture_0_to_1cm') or []
    moisture = finite(moisture_values[hour]) if 0 <= hour < len(moisture_values) else None
    rain = [day['rain'] for day in days]
    return {'temperature': finite(current.get('temperature_2m')), 'wind': finite(current.get('wind_speed_10m')),
            'humidity': finite(current.get('relative_humidity_2m')), 'elevation': finite(data.get('elevation')),
            'moisture': moisture * 100 if moisture is not None else None,
            'rainfall': sum(rain) if len(rain) == 7 and all(value is not None for value in rain) else None,
            'days': days, 'source': 'Open-Meteo', 'modelTime': model_time}


class WeatherService:
    def __init__(self, *, client_factory=None, ttl=60, max_entries=128, clock=time.monotonic):
        self.client_factory = client_factory or (lambda: httpx.AsyncClient(timeout=10))
        self.ttl, self.max_entries, self.clock = ttl, max_entries, clock
        self.cache = OrderedDict()

    async def get(self, latitude, longitude):
        key = (round(latitude, 4), round(longitude, 4))
        cached = self.cache.get(key)
        if cached and self.clock() - cached[0] < self.ttl:
            self.cache.move_to_end(key)
            return {**cached[1], 'cached': True}
        api_key = os.environ.get('OPEN_METEO_API_KEY')
        url = os.environ.get('HARVEST_WEATHER_URL') or ('https://customer-api.open-meteo.com/v1/forecast' if api_key else 'https://api.open-meteo.com/v1/forecast')
        params = {'latitude': key[0], 'longitude': key[1], 'current': 'temperature_2m,relative_humidity_2m,wind_speed_10m',
                  'hourly': 'soil_moisture_0_to_1cm', 'daily': 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
                  'forecast_days': 7, 'timezone': 'auto'}
        if api_key:
            params['apikey'] = api_key
        try:
            async with self.client_factory() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                result = normalize_weather(response.json())
        except (httpx.HTTPError, ValueError, TypeError, AttributeError, KeyError) as error:
            raise WeatherUnavailable('Weather service is temporarily unavailable') from error
        result['fetchedAt'] = datetime.now(timezone.utc).isoformat()
        result['cacheSeconds'] = self.ttl
        self.cache[key] = (self.clock(), result)
        self.cache.move_to_end(key)
        while len(self.cache) > self.max_entries:
            self.cache.popitem(last=False)
        return {**result, 'cached': False}
