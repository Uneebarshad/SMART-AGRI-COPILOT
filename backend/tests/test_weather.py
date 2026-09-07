"""Tests for the weather service, route, and dashboard integration.

All WeatherAPI HTTP calls are mocked — tests never depend on the real
external WeatherAPI service.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Ensure the app package is importable when pytest runs from backend/
# ---------------------------------------------------------------------------
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services import weather_service
from app.services.weather_service import (
    SUPPORTED_DISTRICTS,
    WeatherConfigurationError,
    WeatherDistrictError,
    WeatherProviderError,
    _generate_advisories,
    _map_condition,
    _normalize_current,
    _normalize_daily,
    _normalize_hourly,
    clear_cache,
    get_weather,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

# A realistic WeatherAPI forecast.json response (trimmed to essentials)
def _make_weatherapi_response(
    temp_c: float = 32.0,
    humidity: int = 55,
    wind_kph: float = 10.0,
    condition_code: int = 1003,
    condition_text: str = "Partly cloudy",
    feelslike_c: float = 34.0,
    precip_mm: float = 0.0,
    daily_chance_of_rain: int = 15,
    uv: float = 7.0,
    vis_km: float = 10.0,
    pressure_mb: float = 1005.0,
    cloud: int = 30,
    wind_dir: str = "NW",
    maxtemp_c: float = 36.0,
    mintemp_c: float = 24.0,
    sunrise: str = "05:45 AM",
    sunset: str = "07:10 PM",
    num_forecast_days: int = 3,
) -> dict:
    """Build a mock WeatherAPI forecast.json response."""
    forecast_days = []
    for i in range(num_forecast_days):
        forecast_days.append({
            "date": f"2026-09-0{i + 6}",
            "day": {
                "maxtemp_c": maxtemp_c - i,
                "mintemp_c": mintemp_c - i,
                "avghumidity": humidity,
                "maxwind_kph": wind_kph + 5,
                "daily_chance_of_rain": daily_chance_of_rain + i * 5,
                "uv": uv,
                "condition": {"code": condition_code, "text": condition_text},
            },
            "astro": {
                "sunrise": sunrise,
                "sunset": sunset,
            },
            "hour": [
                {
                    "time": f"2026-09-0{i + 6} {h:02d}:00",
                    "temp_c": temp_c - (2 if h > 18 else 0) + (h - 12) * 0.5,
                    "humidity": humidity,
                    "wind_kph": wind_kph,
                    "chance_of_rain": daily_chance_of_rain,
                    "condition": {"code": condition_code, "text": condition_text},
                }
                for h in range(0, 24, 3)
            ],
        })

    return {
        "current": {
            "temp_c": temp_c,
            "feelslike_c": feelslike_c,
            "humidity": humidity,
            "wind_kph": wind_kph,
            "wind_dir": wind_dir,
            "precip_mm": precip_mm,
            "uv": uv,
            "vis_km": vis_km,
            "pressure_mb": pressure_mb,
            "cloud": cloud,
            "condition": {"code": condition_code, "text": condition_text},
        },
        "forecast": {
            "forecastday": forecast_days,
        },
    }


@pytest.fixture(autouse=True)
def _clear_cache():
    """Clear the weather cache before and after every test."""
    clear_cache()
    yield
    clear_cache()


@pytest.fixture
def mock_settings():
    """Patch settings with a valid weather API key."""
    with patch("app.services.weather_service.settings") as s:
        s.weather_api_key = "test-key-12345"
        s.weather_api_base = "https://api.weatherapi.com/v1"
        yield s


# ---------------------------------------------------------------------------
# Helper to create a mock HTTPResponse
# ---------------------------------------------------------------------------

def _mock_http_response(body: dict, status: int = 200) -> MagicMock:
    """Create a mock urllib response object."""
    resp = MagicMock()
    resp.read.return_value = json.dumps(body).encode("utf-8")
    resp.status = status
    resp.__enter__ = MagicMock(return_value=resp)
    resp.__exit__ = MagicMock(return_value=False)
    return resp


# ===========================================================================
# 1. Condition mapping
# ===========================================================================


class TestConditionMapping:
    def test_clear(self):
        assert _map_condition(1000) == "clear"

    def test_partly_cloudy(self):
        assert _map_condition(1003) == "partly_cloudy"

    def test_cloudy(self):
        assert _map_condition(1006) == "cloudy"

    def test_rain(self):
        assert _map_condition(1063) == "rain"

    def test_thunderstorm(self):
        assert _map_condition(1087) == "thunderstorm"

    def test_fog(self):
        assert _map_condition(1030) == "fog"

    def test_snow(self):
        assert _map_condition(1066) == "snow"

    def test_unknown_defaults_to_cloudy(self):
        assert _map_condition(9999) == "cloudy"

    def test_none_defaults_to_cloudy(self):
        assert _map_condition(None) == "cloudy"


# ===========================================================================
# 2. Normalization
# ===========================================================================


class TestNormalization:
    def test_normalize_current(self):
        raw_current = {
            "temp_c": 32.0,
            "feelslike_c": 34.0,
            "humidity": 55,
            "wind_kph": 10.0,
            "wind_dir": "NW",
            "precip_mm": 0.0,
            "uv": 7.0,
            "vis_km": 10.0,
            "pressure_mb": 1005.0,
            "cloud": 30,
            "condition": {"code": 1003, "text": "Partly cloudy"},
        }
        raw_day = {
            "day": {"daily_chance_of_rain": 20},
        }
        result = _normalize_current(raw_current, raw_day)
        assert result["temperature"] == 32
        assert result["condition"] == "partly_cloudy"
        assert result["feels_like"] == 34
        assert result["humidity"] == 55
        assert result["wind_speed"] == 10
        assert result["precipitation_chance"] == 20

    def test_normalize_current_without_day(self):
        raw_current = {
            "temp_c": 28.0,
            "feelslike_c": 30.0,
            "humidity": 68,
            "wind_kph": 12.0,
            "wind_dir": "SE",
            "precip_mm": 0.5,
            "uv": 5.0,
            "vis_km": 8.0,
            "pressure_mb": 1002.0,
            "cloud": 50,
            "condition": {"code": 1006, "text": "Cloudy"},
        }
        result = _normalize_current(raw_current, None)
        assert result["temperature"] == 28
        assert result["condition"] == "cloudy"
        assert result["precipitation_chance"] == 0

    def test_normalize_hourly(self):
        forecast_days = _make_weatherapi_response()["forecast"]["forecastday"]
        hourly = _normalize_hourly(forecast_days)
        assert len(hourly) <= 24
        assert len(hourly) > 0
        item = hourly[0]
        assert "time" in item
        assert "temperature" in item
        assert "condition" in item
        assert "precipitation_chance" in item
        assert "humidity" in item
        assert "wind_speed" in item

    def test_normalize_daily(self):
        forecast_days = _make_weatherapi_response()["forecast"]["forecastday"]
        daily = _normalize_daily(forecast_days)
        assert len(daily) == 3
        item = daily[0]
        assert "date" in item
        assert "max_temperature" in item
        assert "min_temperature" in item
        assert "condition" in item
        assert "precipitation_chance" in item
        assert "sunrise" in item
        assert "sunset" in item


# ===========================================================================
# 3. Farming advisories
# ===========================================================================


class TestAdvisories:
    def test_high_temp_heat_advisory(self):
        current = {"temperature": 42, "precipitation_chance": 10, "wind_speed": 5, "humidity": 30}
        advisories = _generate_advisories(current, [], "en")
        types = [a["type"] for a in advisories]
        assert "heat_stress" in types

    def test_low_temp_cold_advisory(self):
        current = {"temperature": 8, "precipitation_chance": 10, "wind_speed": 5, "humidity": 30}
        advisories = _generate_advisories(current, [], "en")
        types = [a["type"] for a in advisories]
        assert "cold_caution" in types

    def test_high_rain_advisory(self):
        current = {"temperature": 28, "precipitation_chance": 60, "wind_speed": 5, "humidity": 50}
        advisories = _generate_advisories(current, [], "en")
        types = [a["type"] for a in advisories]
        assert "rain_caution" in types

    def test_strong_wind_advisory(self):
        current = {"temperature": 28, "precipitation_chance": 10, "wind_speed": 30, "humidity": 50}
        advisories = _generate_advisories(current, [], "en")
        types = [a["type"] for a in advisories]
        assert "wind_caution" in types

    def test_high_humidity_fungal_advisory(self):
        current = {"temperature": 28, "precipitation_chance": 10, "wind_speed": 5, "humidity": 85}
        advisories = _generate_advisories(current, [], "en")
        types = [a["type"] for a in advisories]
        assert "fungal_risk" in types

    def test_good_conditions_positive_advisory(self):
        current = {"temperature": 28, "precipitation_chance": 10, "wind_speed": 8, "humidity": 50}
        advisories = _generate_advisories(current, [], "en")
        types = [a["type"] for a in advisories]
        assert "good_fieldwork" in types

    def test_advisories_have_translations(self):
        current = {"temperature": 42, "precipitation_chance": 10, "wind_speed": 5, "humidity": 30}
        advisories = _generate_advisories(current, [], "en")
        for advisory in advisories:
            assert "en" in advisory["text_localized"]
            assert "ur" in advisory["text_localized"]
            assert "ur-Latn" in advisory["text_localized"]

    def test_daily_forecast_rain_overrides_current(self):
        current = {"temperature": 28, "precipitation_chance": 10, "wind_speed": 5, "humidity": 50}
        daily = [{"precipitation_chance": 70}]
        advisories = _generate_advisories(current, daily, "en")
        types = [a["type"] for a in advisories]
        assert "rain_caution" in types


# ===========================================================================
# 4. Cache
# ===========================================================================


class TestCache:
    def test_cache_returns_same_data(self, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            result1 = get_weather(district="Lahore", lang="en")
            # Second call should hit cache (no new HTTP call)
            result2 = get_weather(district="Lahore", lang="en")

        assert result1 == result2

    def test_cache_different_districtes(self, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp1 = _mock_http_response(raw)
        mock_resp2 = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp1) as mock_open:
            get_weather(district="Lahore", lang="en")
            assert mock_open.call_count == 1

        with patch("urllib.request.urlopen", return_value=mock_resp2) as mock_open:
            get_weather(district="Multan", lang="en")
            assert mock_open.call_count == 1

    def test_cache_expires(self, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            get_weather(district="Lahore", lang="en")

        # Manually expire the cache entry
        key = "weather:lahore:en"
        old_entry = weather_service._cache.get(key)
        assert old_entry is not None
        # Set timestamp to the past
        weather_service._cache[key] = (time.monotonic() - 700, old_entry[1])

        mock_resp2 = _mock_http_response(raw)
        with patch("urllib.request.urlopen", return_value=mock_resp2) as mock_open:
            get_weather(district="Lahore", lang="en")
            assert mock_open.call_count == 1


# ===========================================================================
# 5. get_weather — full pipeline
# ===========================================================================


class TestGetWeather:
    def test_lahore_returns_correct_structure(self, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = get_weather(district="Lahore", lang="en")

        assert result["district"] == "Lahore"
        assert result["district_id"] == "lahore"
        assert "current" in result
        assert "hourly" in result
        assert "daily" in result
        assert "advisories" in result
        assert "updated_at" in result
        assert result["forecast_days_available"] == 3
        assert result["forecast_days_limit"] == 3

    def test_islamabad_works(self, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = get_weather(district="Islamabad", lang="en")

        assert result["district"] == "Islamabad"

    def test_multan_works(self, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = get_weather(district="Multan", lang="en")

        assert result["district"] == "Multan"

    def test_case_insensitive_district(self, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = get_weather(district="LAHORE", lang="en")

        assert result["district_id"] == "lahore"

    def test_invalid_district_raises(self, mock_settings):
        with pytest.raises(WeatherDistrictError):
            get_weather(district="InvalidCity", lang="en")

    def test_missing_api_key_raises(self):
        with patch("app.services.weather_service.settings") as mock_s:
            mock_s.weather_api_key = ""
            mock_s.weather_api_base = "https://api.weatherapi.com/v1"
            with pytest.raises(WeatherConfigurationError):
                get_weather(district="Lahore", lang="en")

    def test_provider_http_error(self, mock_settings):
        error = urllib.error.HTTPError(
            url="https://api.weatherapi.com/v1/forecast.json",
            code=500,
            msg="Internal Server Error",
            hdrs=None,
            fp=BytesIO(b"server error"),
        )
        with patch("urllib.request.urlopen", side_effect=error):
            with pytest.raises(WeatherProviderError):
                get_weather(district="Lahore", lang="en")

    def test_provider_timeout(self, mock_settings):
        with patch("urllib.request.urlopen", side_effect=TimeoutError("timed out")):
            with pytest.raises(WeatherProviderError):
                get_weather(district="Lahore", lang="en")

    def test_provider_unreachable(self, mock_settings):
        with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("no route")):
            with pytest.raises(WeatherProviderError):
                get_weather(district="Lahore", lang="en")

    def test_malformed_response_no_current(self, mock_settings):
        raw = {"forecast": {"forecastday": []}}
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            with pytest.raises(WeatherProviderError):
                get_weather(district="Lahore", lang="en")

    def test_malformed_response_no_forecast(self, mock_settings):
        raw = {"current": {"temp_c": 30, "condition": {"code": 1000, "text": "Sunny"}}}
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            with pytest.raises(WeatherProviderError):
                get_weather(district="Lahore", lang="en")

    def test_no_api_key_in_response(self, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = get_weather(district="Lahore", lang="en")

        result_json = json.dumps(result)
        assert "test-key-12345" not in result_json


# ===========================================================================
# 6. Weather route (FastAPI TestClient)
# ===========================================================================


class TestWeatherRoute:
    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from app.main import app
        return TestClient(app)

    def test_endpoint_exists(self, client, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            resp = client.get("/api/weather?district=Lahore&lang=en")
        assert resp.status_code == 200
        data = resp.json()
        assert data["district"] == "Lahore"

    def test_lahore_structure(self, client, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            resp = client.get("/api/weather?district=Lahore&lang=en")
        data = resp.json()
        assert "current" in data
        assert "hourly" in data
        assert "daily" in data
        assert "advisories" in data
        assert "updated_at" in data

    def test_islamabad(self, client, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            resp = client.get("/api/weather?district=Islamabad&lang=en")
        assert resp.status_code == 200
        assert resp.json()["district"] == "Islamabad"

    def test_multan(self, client, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            resp = client.get("/api/weather?district=Multan&lang=en")
        assert resp.status_code == 200
        assert resp.json()["district"] == "Multan"

    def test_invalid_district_rejected(self, client, mock_settings):
        resp = client.get("/api/weather?district=Nowhere&lang=en")
        assert resp.status_code == 400
        data = resp.json()
        assert data["error"]["code"] == "validation_error"

    def test_missing_district_rejected(self, client, mock_settings):
        resp = client.get("/api/weather?district=&lang=en")
        assert resp.status_code == 400

    def test_missing_api_key_returns_503(self, client):
        with patch("app.services.weather_service.settings") as mock_s:
            mock_s.weather_api_key = ""
            mock_s.weather_api_base = "https://api.weatherapi.com/v1"
            clear_cache()
            resp = client.get("/api/weather?district=Lahore&lang=en")
        assert resp.status_code == 503
        assert resp.json()["error"]["code"] == "weather_not_configured"

    def test_provider_error_returns_502(self, client, mock_settings):
        with patch("urllib.request.urlopen", side_effect=TimeoutError("timeout")):
            clear_cache()
            resp = client.get("/api/weather?district=Lahore&lang=en")
        assert resp.status_code == 502
        assert resp.json()["error"]["code"] == "weather_provider_error"

    def test_no_api_key_in_response(self, client, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            resp = client.get("/api/weather?district=Lahore&lang=en")
        assert "test-key-12345" not in resp.text


# ===========================================================================
# 7. Dashboard still works
# ===========================================================================


class TestDashboardIntegration:
    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from app.main import app
        from tests.conftest import make_authenticated_client
        client, _ = make_authenticated_client(email="weather-dash@example.com")
        return client

    def test_dashboard_still_works_with_weather(self, client, mock_settings):
        raw = _make_weatherapi_response()
        mock_resp = _mock_http_response(raw)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            resp = client.get("/api/dashboard?lang=en")
        assert resp.status_code == 200
        data = resp.json()
        assert "weather" in data
        assert "current" in data["weather"]

    def test_dashboard_fallback_on_weather_failure(self, client):
        """Dashboard should still work even when weather API fails."""
        with patch("urllib.request.urlopen", side_effect=TimeoutError("timeout")):
            clear_cache()
            resp = client.get("/api/dashboard?lang=en")
        assert resp.status_code == 200
        data = resp.json()
        assert "weather" in data
        # Should fall back to DEFAULT_WEATHER
        assert "current" in data["weather"]
        assert "temperature_c" in data["weather"]["current"]
