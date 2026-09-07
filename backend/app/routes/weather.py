"""Weather forecast endpoint — WeatherAPI.com backed."""

import logging

from fastapi import APIRouter

from app.dependencies import error_response
from app.services.weather_service import (
    WeatherConfigurationError,
    WeatherDistrictError,
    WeatherProviderError,
    get_weather,
)

logger = logging.getLogger("smart_agri_copilot.weather")

router = APIRouter()


@router.get("/weather")
def get_weather_forecast(
    district: str = "",
    lang: str = "en",
):
    """Return current weather, hourly/daily forecast, and farming advisories.

    Query parameters:
        district - Pakistan district name or ID (e.g. "Lahore", "lahore", "Islamabad")
        lang     - response language: en | ur | ur-Latn (default: en)

    The response is compatible with the Weather Page specification and the
    existing frontend weather components.
    """
    # Validate language
    if lang not in ("en", "ur", "ur-Latn"):
        lang = "en"

    # Validate district is provided
    if not district or not district.strip():
        return error_response(
            400,
            "validation_error",
            "The 'district' query parameter is required.",
        )

    try:
        return get_weather(district=district.strip(), lang=lang)

    except WeatherDistrictError as exc:
        return error_response(400, "validation_error", str(exc))

    except WeatherConfigurationError:
        logger.warning(
            "GET /api/weather rejected: WEATHER_API_KEY is not set in .env"
        )
        return error_response(
            503,
            "weather_not_configured",
            "Weather service is not available. API key is not configured.",
        )

    except WeatherProviderError as exc:
        logger.error("WeatherAPI failure on /api/weather: %s", exc)
        return error_response(
            502,
            "weather_provider_error",
            "Could not retrieve weather data. Please try again later.",
        )

    except Exception as exc:
        logger.error("Unexpected weather error: %s", exc, exc_info=True)
        return error_response(
            500,
            "weather_error",
            "An unexpected error occurred while fetching weather data.",
        )
