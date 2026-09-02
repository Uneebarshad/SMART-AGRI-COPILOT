from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    app_name: str = "Smart Agri Copilot API"
    debug: bool = False

    # Database
    database_url: str = "postgresql://user:password@localhost:5432/smart_agri_copilot"

    # CORS - list of allowed frontend origins
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
