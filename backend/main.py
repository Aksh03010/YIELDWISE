from pathlib import Path
import os
from typing import Literal
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field
from .inference import ModelRegistry
from .weather import WeatherService, WeatherUnavailable

app = FastAPI(title="HARVEST research inference", version="1.0.0")
registry = ModelRegistry(os.environ.get("HARVEST_MODEL_DIR", str(Path(__file__).parent / "artifacts")))
weather_service = WeatherService()


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    crop: str
    target: str
    inputs: dict
    site_id: str | None = None
    research_only: Literal[True]


class WeatherRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    latitude: float = Field(ge=14, le=84, strict=True, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=-50, strict=True, allow_inf_nan=False)


@app.get("/api/health")
def health():
    return {"status": "ok", "registered_crops": sorted(registry.models), "rejected_artifacts": sorted(registry.errors)}


@app.get("/api/models")
def models():
    return registry.catalog()


@app.post('/api/weather')
async def weather(request: WeatherRequest):
    try:
        return await weather_service.get(request.latitude, request.longitude)
    except WeatherUnavailable as error:
        raise HTTPException(status_code=503, detail='Weather is temporarily unavailable. Try again.') from error


@app.post("/api/predict")
def predict(request: PredictionRequest):
    try:
        return registry.predict(request.crop, request.target, request.inputs, request.site_id)
    except LookupError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except (ValueError, TypeError, KeyError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


# The production container serves React and the API on the same origin.
dist = Path(__file__).resolve().parent.parent / 'dist'
if dist.is_dir():
    @app.get('/{path:path}', include_in_schema=False)
    def frontend(path: str):
        if path == 'api' or path.startswith('api/'):
            raise HTTPException(status_code=404, detail='API route not found')
        requested = (dist / path).resolve()
        if requested.is_relative_to(dist.resolve()) and requested.is_file():
            return FileResponse(requested)
        return FileResponse(dist / 'index.html')
