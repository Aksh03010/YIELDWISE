"""Experimental maize inference from actual NASA POWER point weather.

The strict historical trial endpoint remains unchanged. This separate path
reports extrapolation instead of presenting new fields as validated forecasts.
"""
from collections import OrderedDict
from datetime import date, datetime, timedelta, timezone
import hashlib
import json
import math
import time
import httpx
from .inference import predict_target
from .weather import finite

PARAMETER_UNITS = {
    'QV2M': 'g/kg', 'T2MDEW': 'C', 'PS': 'kPa', 'RH2M': '%', 'WS2M': 'm/s',
    'GWETTOP': '1', 'ALLSKY_SFC_SW_DWN': 'MJ/m^2/day', 'ALLSKY_SFC_PAR_TOT': 'W/m^2',
    'T2M_MAX': 'C', 'T2M_MIN': 'C', 'T2MWET': 'C', 'GWETROOT': '1', 'T2M': 'C',
    'GWETPROF': '1', 'ALLSKY_SFC_SW_DNI': 'MJ/m^2/day', 'PRECTOTCORR': 'mm/day',
}


class FieldDataUnavailable(Exception):
    pass


def normalize_power(data, latitude, longitude, planting):
    dates = [(planting + timedelta(days=i)).strftime('%Y%m%d') for i in range(31)]
    parameters = data['properties']['parameter']
    features = {'latitude': latitude, 'longitude': longitude, 'Year': planting.year,
                'weather_days_observed': 31, 'weather_window_complete_31_days': 1}
    conversions = []
    fill = data.get('header', {}).get('fill_value', -999)
    if data.get('header', {}).get('time_standard') != 'LST':
        raise FieldDataUnavailable('NASA weather must use local solar time for this model.')
    for name, expected in PARAMETER_UNITS.items():
        actual = data.get('parameters', {}).get(name, {}).get('units')
        factor = 1
        if actual != expected:
            if name == 'ALLSKY_SFC_PAR_TOT' and actual == 'MJ/m^2/day':
                factor = 1e6 / 86400  # Frozen G2F preparation used average W/m².
            else:
                raise FieldDataUnavailable(f'Unexpected NASA units for {name}: {actual}. Expected {expected}.')
            conversions.append({'parameter': name, 'from': actual, 'to': expected, 'factor': factor})
        values = [parameters.get(name, {}).get(day) for day in dates]
        if any(finite(value) is None or value == fill or value <= -999 for value in values):
            raise FieldDataUnavailable(f'NASA has not supplied all 31 days for {name}. Try an earlier completed planting window.')
        values = [value * factor for value in values]
        features.update({f'{name}_mean': math.fsum(values) / 31, f'{name}_min': min(values),
                         f'{name}_max': max(values), f'{name}_sum': math.fsum(values)})
    return {'features': features, 'source': {
        'provider': 'NASA POWER', 'community': 'AG', 'time_standard': 'LST',
        'start': planting.isoformat(), 'end': (planting + timedelta(days=30)).isoformat(), 'days': 31,
        'api_version': data.get('header', {}).get('api', {}).get('version'),
        'response_sha256': hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest(),
        'unit_conversions': conversions, 'fetched_at': datetime.now(timezone.utc).isoformat(),
        'resolution_note': 'Gridded environmental data near the coordinates; not a field soil measurement.',
    }}


class PowerService:
    def __init__(self, *, client_factory=None, clock=time.monotonic, ttl=86400, max_entries=128):
        self.client_factory = client_factory or (lambda: httpx.AsyncClient(timeout=45))
        self.clock, self.ttl, self.max_entries = clock, ttl, max_entries
        self.cache = OrderedDict()

    async def get(self, latitude, longitude, planting):
        end = planting + timedelta(days=30)
        if planting.year < 2014:
            raise ValueError('Use a planting date from 2014 onward for this maize research model.')
        if end >= date.today():
            raise ValueError(f'The model needs 31 observed days after planting. This window completes on {end.isoformat()}; NASA may publish with an additional delay.')
        key = (round(latitude, 4), round(longitude, 4), planting.isoformat())
        cached = self.cache.get(key)
        if cached and self.clock() - cached[0] < self.ttl:
            self.cache.move_to_end(key)
            return {**cached[1], 'source': {**cached[1]['source'], 'cached': True}}
        try:
            async with self.client_factory() as client:
                response = await client.get('https://power.larc.nasa.gov/api/temporal/daily/point', params={
                    'parameters': ','.join(PARAMETER_UNITS), 'community': 'AG', 'latitude': key[0], 'longitude': key[1],
                    'start': planting.strftime('%Y%m%d'), 'end': end.strftime('%Y%m%d'), 'format': 'JSON', 'time-standard': 'LST',
                })
                response.raise_for_status()
                result = normalize_power(response.json(), key[0], key[1], planting)
        except (httpx.HTTPError, KeyError, TypeError, ValueError, AttributeError) as error:
            raise FieldDataUnavailable('NASA environmental data could not be retrieved. Retry this field estimate.') from error
        self.cache[key] = (self.clock(), result)
        self.cache.move_to_end(key)
        while len(self.cache) > self.max_entries:
            self.cache.popitem(last=False)
        return {**result, 'source': {**result['source'], 'cached': False}}


def predict_field(registry, crop, environment, area_ha):
    if crop != 'corn':
        raise LookupError('Location-based inference is currently available for maize. The SoyNAM model requires experimental genotype/site inputs; it cannot predict from coordinates alone.')
    registered = registry.models.get(crop)
    if not registered:
        raise LookupError('The verified maize model is not loaded.')
    features = environment['features']
    predictions, unavailable = [], {}
    warnings = ['Experimental field estimate. The trial evaluation does not validate accuracy for this farm or a future season.',
                'Current NASA data revisions can differ from the frozen training snapshot.']
    if features['Year'] > 2021:
        warnings.append(f"The {features['Year']} season is outside the 2014–2021 evaluated research years.")
    for name, target in registered['artifact']['targets'].items():
        if target['model']['type'] in ('shrunk_site_history', 'mean'):
            unavailable[name] = 'This selected model uses training/site history and cannot provide a location-specific estimate for a new field.'
            continue
        try:
            value = predict_target(crop, target, features)
            if value < 0 or (name == 'Grain_Moisture' and value > 100):
                raise ValueError('The model produced a physically invalid value outside its fitted domain.')
            bounds = target.get('training_bounds', {})
            outside = [key for key, limits in bounds.items() if features.get(key) is not None and not limits['min'] <= features[key] <= limits['max']]
            predictions.append({'crop': crop, 'target': name, 'value': value, 'unit': target['unit'],
                'research_only': True, 'model_version': registered['version'], 'test_metrics': target['test_metrics'],
                'outside_training_bounds': outside, 'warnings': [target['warning'], f'{len(outside)} inputs fall outside fitted training ranges.']})
        except (ValueError, KeyError, TypeError) as error:
            unavailable[name] = str(error)
    yield_result = next((result for result in predictions if result['target'] == 'Yield_Mg_ha'), None)
    production = yield_result['value'] * area_ha if yield_result else None
    return {'crop': crop, 'research_only': True, 'location_driven': True,
        'latitude': features['latitude'], 'longitude': features['longitude'], 'area_ha': area_ha,
        'planting_date': environment['source']['start'], 'source': environment['source'],
        'predictions': predictions, 'unavailable_targets': unavailable, 'production_tonnes': production,
        'model_version': registered['version'], 'warnings': warnings,
        'environment': {'mean_temperature_c': features['T2M_mean'], 'minimum_temperature_c': features['T2M_MIN_min'],
            'maximum_temperature_c': features['T2M_MAX_max'], 'rainfall_mm': features['PRECTOTCORR_sum'],
            'root_zone_wetness': features['GWETROOT_mean']}}
