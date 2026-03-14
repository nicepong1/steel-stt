from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    stt_service: str = "mock"  # "mock" 또는 "google"
    google_application_credentials: str = ""
    host: str = "0.0.0.0"
    port: int = 8000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
