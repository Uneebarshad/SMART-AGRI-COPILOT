from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    app_name: str = "Smart Agri Copilot API"
    debug: bool = False

    # Database
    database_url: str = "postgresql://user:password@localhost:5432/smart_agri_copilot"
    # Echo raw SQL statements to the console (debug aid)
    db_echo: bool = False

    # CORS - list of allowed frontend origins
    cors_origins: list[str] = ["http://localhost:5173"]

    # Gemini — Google's official SDK (google-genai). Used by the AI assistant
    # chat and by leaf-scan image diagnosis. Backend only: the key is never
    # exposed to the frontend and never written to logs.
    gemini_api_key: str = ""                  # Google AI Studio API key
    gemini_model: str = "gemini-2.5-flash"    # chat + vision capable model

    # Weather — WeatherAPI.com forecast provider (never sent to frontend)
    weather_api_key: str = ""    # WeatherAPI.com API key
    weather_api_base: str = "https://api.weatherapi.com/v1"

    # JWT authentication
    jwt_secret_key: str = "dev-secret-change-me"  # override in .env; never hardcode real secrets
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # Password-reset tokens
    password_reset_token_expire_minutes: int = 60  # reset link validity window

    # Email / transactional-mail configuration
    email_provider: str = "console"  # "console" (logs), "smtp", or "none" (disabled)
    email_from: str = "no-reply@smartagri.local"
    # SMTP settings (used when email_provider == "smtp")
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""  # never logged
    smtp_use_tls: bool = True

    # Frontend origin used to build password-reset URLs
    frontend_url: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
