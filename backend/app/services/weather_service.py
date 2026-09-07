"""Weather service — WeatherAPI.com provider with in-memory cache.

Reads configuration from environment variables via app.config.Settings:
    WEATHER_API_KEY  — WeatherAPI.com API key (never exposed to frontend)
    WEATHER_API_BASE — base URL (default: https://api.weatherapi.com/v1)

Uses only the Python standard library (urllib) so no extra SDK is needed.
Provider-isolated so another weather provider could be substituted later.
"""

from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from app.config import settings

logger = logging.getLogger("smart_agri_copilot.weather")

REQUEST_TIMEOUT_SECONDS = 10
CACHE_TTL_SECONDS = 600  # 10 minutes

# ---------------------------------------------------------------------------
# Error types
# ---------------------------------------------------------------------------


class WeatherConfigurationError(Exception):
    """Raised when the weather service is not configured (missing key)."""


class WeatherProviderError(Exception):
    """Raised when the weather provider returns an error or unexpected response."""


class WeatherDistrictError(Exception):
    """Raised when the requested district is not supported."""


# ---------------------------------------------------------------------------
# Pakistan district registry
# ---------------------------------------------------------------------------

# Maps district IDs (matching the frontend's districts.js) to the display
# name and the query string sent to WeatherAPI.  WeatherAPI accepts city
# names directly, so we send the English display name.
#
# The full list mirrors the frontend's DISTRICTS array so that any district
# selectable in the UI works here as well.

SUPPORTED_DISTRICTS: dict[str, dict[str, str]] = {
    # Punjab (36 districts)
    "attock":             {"name": "Attock",           "query": "Attock, Pakistan"},
    "bahawalnagar":       {"name": "Bahawalnagar",     "query": "Bahawalnagar, Pakistan"},
    "bahawalpur":         {"name": "Bahawalpur",       "query": "Bahawalpur, Pakistan"},
    "bhakkar":            {"name": "Bhakkar",          "query": "Bhakkar, Pakistan"},
    "chakwal":            {"name": "Chakwal",          "query": "Chakwal, Pakistan"},
    "chiniot":            {"name": "Chiniot",          "query": "Chiniot, Pakistan"},
    "dera-ghazi-khan":    {"name": "Dera Ghazi Khan",  "query": "Dera Ghazi Khan, Pakistan"},
    "faisalabad":         {"name": "Faisalabad",       "query": "Faisalabad, Pakistan"},
    "gujranwala":         {"name": "Gujranwala",       "query": "Gujranwala, Pakistan"},
    "gujrat":             {"name": "Gujrat",           "query": "Gujrat, Pakistan"},
    "hafizabad":          {"name": "Hafizabad",        "query": "Hafizabad, Pakistan"},
    "jhang":              {"name": "Jhang",            "query": "Jhang, Pakistan"},
    "jhelum":             {"name": "Jhelum",           "query": "Jhelum, Pakistan"},
    "kasur":              {"name": "Kasur",            "query": "Kasur, Pakistan"},
    "khanewal":           {"name": "Khanewal",         "query": "Khanewal, Pakistan"},
    "khushab":            {"name": "Khushab",          "query": "Khushab, Pakistan"},
    "lahore":             {"name": "Lahore",           "query": "Lahore, Pakistan"},
    "layyah":             {"name": "Layyah",           "query": "Layyah, Pakistan"},
    "lodhran":            {"name": "Lodhran",          "query": "Lodhran, Pakistan"},
    "mandi-bahauddin":    {"name": "Mandi Bahauddin",  "query": "Mandi Bahauddin, Pakistan"},
    "mianwali":           {"name": "Mianwali",         "query": "Mianwali, Pakistan"},
    "multan":             {"name": "Multan",           "query": "Multan, Pakistan"},
    "muzaffargarh":       {"name": "Muzaffargarh",     "query": "Muzaffargarh, Pakistan"},
    "nankana-sahib":      {"name": "Nankana Sahib",    "query": "Nankana Sahib, Pakistan"},
    "narowal":            {"name": "Narowal",          "query": "Narowal, Pakistan"},
    "okara":              {"name": "Okara",            "query": "Okara, Pakistan"},
    "pakpattan":          {"name": "Pakpattan",        "query": "Pakpattan, Pakistan"},
    "rahim-yar-khan":     {"name": "Rahim Yar Khan",   "query": "Rahim Yar Khan, Pakistan"},
    "rajanpur":           {"name": "Rajanpur",         "query": "Rajanpur, Pakistan"},
    "rawalpindi":         {"name": "Rawalpindi",       "query": "Rawalpindi, Pakistan"},
    "sahiwal":            {"name": "Sahiwal",          "query": "Sahiwal, Pakistan"},
    "sargodha":           {"name": "Sargodha",         "query": "Sargodha, Pakistan"},
    "sheikhupura":        {"name": "Sheikhupura",      "query": "Sheikhupura, Pakistan"},
    "sialkot":            {"name": "Sialkot",          "query": "Sialkot, Pakistan"},
    "toba-tek-singh":     {"name": "Toba Tek Singh",   "query": "Toba Tek Singh, Pakistan"},
    "vehari":             {"name": "Vehari",           "query": "Vehari, Pakistan"},
    # Islamabad Capital Territory
    "islamabad":          {"name": "Islamabad",        "query": "Islamabad, Pakistan"},
    # Sindh (major districts)
    "karachi":            {"name": "Karachi",          "query": "Karachi, Pakistan"},
    "hyderabad":          {"name": "Hyderabad",        "query": "Hyderabad, Sindh, Pakistan"},
    "sukkur":             {"name": "Sukkur",           "query": "Sukkur, Pakistan"},
    "larkana":            {"name": "Larkana",          "query": "Larkana, Pakistan"},
    "shaheed-benazirabad": {"name": "Shaheed Benazirabad", "query": "Nawabshah, Pakistan"},
    # Khyber Pakhtunkhwa (major districts)
    "peshawar":           {"name": "Peshawar",         "query": "Peshawar, Pakistan"},
    "mardan":             {"name": "Mardan",           "query": "Mardan, Pakistan"},
    "swat":               {"name": "Swat",             "query": "Saidu Sharif, Pakistan"},
    "dera-ismail-khan":   {"name": "Dera Ismail Khan", "query": "Dera Ismail Khan, Pakistan"},
    "abbottabad":         {"name": "Abbottabad",       "query": "Abbottabad, Pakistan"},
    # Balochistan (major district)
    "quetta":             {"name": "Quetta",           "query": "Quetta, Pakistan"},
}

# ---------------------------------------------------------------------------
# WeatherAPI condition-code → application condition category
# ---------------------------------------------------------------------------

# WeatherAPI returns numeric condition codes (1000–1282).  We map them into
# a small set of application-friendly categories that the frontend icon
# system already understands.

_CONDITION_MAP: dict[int, str] = {}

# Sunny / clear
for _code in (1000,):
    _CONDITION_MAP[_code] = "clear"

# Partly cloudy
for _code in (1003,):
    _CONDITION_MAP[_code] = "partly_cloudy"

# Overcast / cloudy
for _code in (1006, 1009):
    _CONDITION_MAP[_code] = "cloudy"

# Fog / mist
for _code in (1030, 1135, 1147):
    _CONDITION_MAP[_code] = "fog"

# Snow
for _code in (1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264):
    _CONDITION_MAP[_code] = "snow"

# Thunderstorm
for _code in (1087, 1273, 1276, 1279, 1282):
    _CONDITION_MAP[_code] = "thunderstorm"

# Rain / drizzle / showers
for _code in (1042, 1045, 1048, 1049, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057, 1058, 1059, 1060, 1061, 1062, 1063, 1064, 1065, 1067, 1068, 1070, 1071, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1180, 1181, 1182, 1183, 1184, 1185, 1186, 1187, 1188, 1189, 1191, 1192, 1193, 1195, 1198, 1201, 1204, 1207, 1240, 1243, 1246, 1249, 1252):
    _CONDITION_MAP[_code] = "rain"

# Blowing dust / sand — treat as cloudy
for _code in (1114,):
    _CONDITION_MAP[_code] = "cloudy"

_DEFAULT_CONDITION = "cloudy"

# Human-readable condition labels (English)
_CONDITION_LABELS: dict[str, str] = {
    "clear": "Clear sky",
    "partly_cloudy": "Partly cloudy",
    "cloudy": "Cloudy",
    "rain": "Rain",
    "thunderstorm": "Thunderstorm",
    "snow": "Snow",
    "fog": "Fog",
}

# ---------------------------------------------------------------------------
# Farming advisory translations
# ---------------------------------------------------------------------------

_ADVISORY_TEXT: dict[str, dict[str, str]] = {
    "heat_stress": {
        "en": "High temperatures expected. Ensure livestock have shade and water. Delay fieldwork during peak heat.",
        "ur": "شدید گرمی متوقع ہے۔ مویشیوں کو سایہ اور پانی فراہم کریں۔ شدید گرمی میں کھیت کا کام مؤخر کریں۔",
        "ur-Latn": "Shiddat garmi mutawaqqa hai. Maweshiyon ko saya aur paani faraham karein. Shiddat garmi mein khet ka kaam muakhkhar karein.",
    },
    "rain_caution": {
        "en": "Rain expected soon. Avoid spraying pesticides or fertilizer. Cover harvested produce and secure loose materials.",
        "ur": "بارش جلد متوقع ہے۔ کیڑے مار ادویات یا کھاد کا سپرے نہ کریں۔ کٹی ہوئی پیداوار کو ڈھانپیں اور ڈھیلے سامان کو محفوظ کریں۔",
        "ur-Latn": "Barish jald mutawaqqa hai. Keeray maar adviyat ya khaad ka spray na karein. Kati hui paidawar ko dhakkein aur dheelay saman ko mehfooz karein.",
    },
    "wind_caution": {
        "en": "Strong winds expected. Delay pesticide spraying and avoid applying fertilizers that may drift.",
        "ur": "تیز ہوائیں متوقع ہیں۔ کیڑے مار ادویات کا سپرے مؤخر کریں اور ایسی کھاد نہ ڈالیں جو اڑ سکتی ہے۔",
        "ur-Latn": "Tez hawayein mutawaqqa hain. Keeray maar adviyat ka spray muakhkhar karein aur aisi khaad na daalein jo urr sakti hai.",
    },
    "fungal_risk": {
        "en": "High humidity and warm temperatures increase fungal disease risk. Monitor crops closely and ensure good air circulation.",
        "ur": "زیادہ نمی اور گرم درجہ حرارت پھپھوندی کے امراض کا خطرہ بڑھاتے ہیں۔ فصلوں کی نگرانی کریں اور ہوا کی اچھی آمد و رفت یقینی بنائیں۔",
        "ur-Latn": "Zyada nami aur garam darja hararat phaphoondi ke amraz ka khatra barhatay hain. Faslon ki nigrani karein aur hawa ki achi aamad-o-raft yaqini banayein.",
    },
    "good_fieldwork": {
        "en": "Favourable conditions for fieldwork. Low rain chance and mild winds make this a good window for spraying or harvesting.",
        "ur": "کھیت کے کام کے لیے سازگار حالات۔ بارش کا کم امکان اور ہلکی ہوائیں سپرے یا کٹائی کے لیے اچھا وقت ہے۔",
        "ur-Latn": "Khet ke kaam ke liye musaal halaat. Barish ka kam imkaan aur halki hawayein spray ya katai ke liye achha waqt hai.",
    },
    "cold_caution": {
        "en": "Low temperatures expected. Protect sensitive crops from frost. Delay transplanting of seedlings.",
        "ur": "کم درجہ حرارت متوقع ہے۔ نازک فصلوں کو پالے سے بچائیں۔ پودوں کی منتقلی مؤخر کریں۔",
        "ur-Latn": "Kam darja hararat mutawaqqa hai. Nazuk faslon ko paalay se bachayein. Paudon ki muntaqili muakhkhar karein.",
    },
}

# ---------------------------------------------------------------------------
# In-memory cache
# ---------------------------------------------------------------------------

_cache: dict[str, tuple[float, dict]] = {}


def _cache_key(district: str, lang: str) -> str:
    """Build a cache key from district and language."""
    return f"weather:{district}:{lang}"


def _cache_get(key: str) -> dict | None:
    """Return cached data if present and not expired."""
    entry = _cache.get(key)
    if entry is None:
        return None
    ts, data = entry
    if time.monotonic() - ts > CACHE_TTL_SECONDS:
        _cache.pop(key, None)
        return None
    return data


def _cache_set(key: str, data: dict) -> None:
    """Store data in the cache with the current timestamp."""
    _cache[key] = (time.monotonic(), data)


def clear_cache() -> None:
    """Clear all cached weather data (useful for testing)."""
    _cache.clear()


# ---------------------------------------------------------------------------
# WeatherAPI HTTP call
# ---------------------------------------------------------------------------


def _fetch_weatherapi(district_id: str) -> dict:
    """Call WeatherAPI.com forecast endpoint and return the raw JSON.

    Uses the /v1/forecast.json endpoint which returns current + forecast days.
    The free plan supports up to 3 forecast days.
    """
    if not settings.weather_api_key:
        raise WeatherConfigurationError(
            "Weather service is not configured. Set WEATHER_API_KEY."
        )

    district_info = SUPPORTED_DISTRICTS[district_id]
    query_location = district_info["query"]

    params = urllib.parse.urlencode({
        "key": settings.weather_api_key,
        "q": query_location,
        "days": 3,
        "aqi": "no",
        "alerts": "no",
    })
    base = settings.weather_api_base.rstrip("/")
    url = f"{base}/forecast.json?{params}"

    request = urllib.request.Request(url, method="GET")

    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8", errors="replace")[:300]
        except Exception:  # noqa: BLE001
            pass
        logger.error("WeatherAPI HTTP %s: %s", exc.code, detail)
        if exc.code == 400:
            raise WeatherDistrictError(
                f"WeatherAPI could not resolve location for {district_info['name']}"
            ) from exc
        if exc.code in (401, 403):
            raise WeatherConfigurationError(
                "WeatherAPI key is invalid or expired"
            ) from exc
        if exc.code == 429:
            raise WeatherProviderError(
                "WeatherAPI rate limit exceeded"
            ) from exc
        raise WeatherProviderError(
            f"WeatherAPI returned HTTP {exc.code}"
        ) from exc
    except urllib.error.URLError as exc:
        logger.error("WeatherAPI unreachable: %s", exc.reason)
        raise WeatherProviderError("WeatherAPI is unreachable") from exc
    except TimeoutError as exc:
        logger.error("WeatherAPI timed out")
        raise WeatherProviderError("WeatherAPI request timed out") from exc


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------


def _map_condition(code: int | None) -> str:
    """Map a WeatherAPI condition code to an application condition category."""
    if code is None:
        return _DEFAULT_CONDITION
    return _CONDITION_MAP.get(code, _DEFAULT_CONDITION)


def _normalize_current(raw_current: dict, raw_day: dict | None) -> dict:
    """Normalize WeatherAPI current + today's day object into our current shape."""
    condition_code = raw_current.get("condition", {}).get("code")
    condition_text = raw_current.get("condition", {}).get("text", "")

    # Use today's day object for precipitation probability if available
    daily_chance_rain = 0
    if raw_day and "day" in raw_day:
        daily_chance_rain = raw_day["day"].get("daily_chance_of_rain", 0)

    return {
        "temperature": round(raw_current.get("temp_c", 0)),
        "condition": _map_condition(condition_code),
        "condition_text": condition_text,
        "feels_like": round(raw_current.get("feelslike_c", 0)),
        "humidity": raw_current.get("humidity", 0),
        "wind_speed": round(raw_current.get("wind_kph", 0)),
        "wind_direction": raw_current.get("wind_dir", ""),
        "precipitation": round(raw_current.get("precip_mm", 0), 1),
        "precipitation_chance": daily_chance_rain,
        "uv_index": round(raw_current.get("uv", 0)),
        "visibility": round(raw_current.get("vis_km", 0)),
        "pressure": round(raw_current.get("pressure_mb", 0)),
        "cloud_cover": raw_current.get("cloud", 0),
    }


def _normalize_hourly(forecast_days: list[dict]) -> list[dict]:
    """Extract and normalize hourly data from forecast days.

    Returns up to 24 hours of data starting from the current hour.
    """
    hourly_items: list[dict] = []

    for day in forecast_days:
        date_str = day.get("date", "")
        for hour in day.get("hour", []):
            time_str = hour.get("time", "")  # "2026-09-06 14:00"
            condition_code = hour.get("condition", {}).get("code")

            # Extract just the time portion for display
            display_time = ""
            if " " in time_str:
                time_part = time_str.split(" ")[1]  # "14:00"
                try:
                    hour_val = int(time_part.split(":")[0])
                    if hour_val == 0:
                        display_time = "12 AM"
                    elif hour_val < 12:
                        display_time = f"{hour_val} AM"
                    elif hour_val == 12:
                        display_time = "12 PM"
                    else:
                        display_time = f"{hour_val - 12} PM"
                except (ValueError, IndexError):
                    display_time = time_part

            hourly_items.append({
                "time": display_time,
                "datetime": time_str,
                "temperature": round(hour.get("temp_c", 0)),
                "condition": _map_condition(condition_code),
                "precipitation_chance": hour.get("chance_of_rain", 0),
                "humidity": hour.get("humidity", 0),
                "wind_speed": round(hour.get("wind_kph", 0)),
            })

    # Return up to 24 hours — the frontend hourly component shows 7 items
    return hourly_items[:24]


def _normalize_daily(forecast_days: list[dict]) -> list[dict]:
    """Normalize daily forecast data from WeatherAPI forecast days."""
    daily_items: list[dict] = []

    for day in forecast_days:
        day_data = day.get("day", {})
        astro = day.get("astro", {})
        condition_code = day_data.get("condition", {}).get("code")

        daily_items.append({
            "date": day.get("date", ""),
            "max_temperature": round(day_data.get("maxtemp_c", 0)),
            "min_temperature": round(day_data.get("mintemp_c", 0)),
            "condition": _map_condition(condition_code),
            "condition_text": day_data.get("condition", {}).get("text", ""),
            "precipitation_chance": day_data.get("daily_chance_of_rain", 0),
            "max_wind_kph": round(day_data.get("maxwind_kph", 0)),
            "humidity": round(day_data.get("avghumidity", 0)),
            "uv_index": round(day_data.get("uv", 0)),
            "sunrise": astro.get("sunrise", ""),
            "sunset": astro.get("sunset", ""),
        })

    return daily_items


# ---------------------------------------------------------------------------
# Farming advisories
# ---------------------------------------------------------------------------


def _generate_advisories(current: dict, daily: list[dict], lang: str) -> list[dict]:
    """Generate deterministic rule-based farming advisories from weather data.

    Rules are evaluated in priority order; at most a few advisories are
    returned to keep the UI concise.
    """
    advisories: list[dict] = []

    temp = current.get("temperature", 0)
    rain_chance = current.get("precipitation_chance", 0)
    wind = current.get("wind_speed", 0)
    humidity = current.get("humidity", 0)

    # Also check today's forecast for rain chance if current doesn't have it
    if daily:
        today = daily[0]
        rain_chance = max(rain_chance, today.get("precipitation_chance", 0))

    # 1. High temperature → heat/stress caution (≥ 40°C)
    if temp >= 40:
        advisories.append({
            "type": "heat_stress",
            "tone": "warning",
            "text_localized": _ADVISORY_TEXT["heat_stress"],
        })

    # 2. Low temperature → cold/frost caution (≤ 10°C)
    if temp <= 10:
        advisories.append({
            "type": "cold_caution",
            "tone": "warning",
            "text_localized": _ADVISORY_TEXT["cold_caution"],
        })

    # 3. High rain chance → rain/field-work caution (≥ 40%)
    if rain_chance >= 40:
        advisories.append({
            "type": "rain_caution",
            "tone": "warning",
            "text_localized": _ADVISORY_TEXT["rain_caution"],
        })

    # 4. Strong wind → spraying caution (≥ 25 km/h)
    if wind >= 25:
        advisories.append({
            "type": "wind_caution",
            "tone": "warning",
            "text_localized": _ADVISORY_TEXT["wind_caution"],
        })

    # 5. High humidity + warm → fungal disease risk
    if humidity >= 80 and temp >= 25:
        advisories.append({
            "type": "fungal_risk",
            "tone": "info",
            "text_localized": _ADVISORY_TEXT["fungal_risk"],
        })

    # 6. If no warnings at all, give a positive advisory
    if not advisories:
        advisories.append({
            "type": "good_fieldwork",
            "tone": "success",
            "text_localized": _ADVISORY_TEXT["good_fieldwork"],
        })

    return advisories


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_weather(*, district: str, lang: str = "en") -> dict:
    """Fetch, normalize, and cache weather data for a Pakistan district.

    Returns the full normalized weather payload including current conditions,
    hourly forecast, daily forecast, and farming advisories.

    Raises WeatherConfigurationError when credentials are missing,
    WeatherDistrictError when the district is not supported, or
    WeatherProviderError when the upstream API call fails.
    """
    # Validate district
    district_id = district.strip().lower()
    if district_id not in SUPPORTED_DISTRICTS:
        raise WeatherDistrictError(
            f"Unsupported district: {district!r}. "
            f"Supported: {', '.join(sorted(SUPPORTED_DISTRICTS.keys()))}"
        )

    # Check cache
    cache_key = _cache_key(district_id, lang)
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    # Fetch from WeatherAPI
    raw = _fetch_weatherapi(district_id)

    # Validate minimum structure
    if "current" not in raw:
        logger.error("WeatherAPI response missing 'current': %s", str(raw)[:300])
        raise WeatherProviderError("Malformed response from WeatherAPI")

    forecast_days = raw.get("forecast", {}).get("forecastday", [])
    if not forecast_days:
        logger.error("WeatherAPI response has no forecast days")
        raise WeatherProviderError("No forecast data from WeatherAPI")

    # Normalize
    today_raw = forecast_days[0] if forecast_days else None
    current = _normalize_current(raw["current"], today_raw)
    hourly = _normalize_hourly(forecast_days)
    daily = _normalize_daily(forecast_days)
    advisories = _generate_advisories(current, daily, lang)

    district_info = SUPPORTED_DISTRICTS[district_id]
    now_utc = datetime.now(timezone.utc).isoformat()

    result = {
        "district": district_info["name"],
        "district_id": district_id,
        "current": current,
        "hourly": hourly,
        "daily": daily,
        "advisories": advisories,
        "forecast_days_available": len(forecast_days),
        "forecast_days_limit": 3,
        "updated_at": now_utc,
    }

    # Cache the result
    _cache_set(cache_key, result)

    return result
