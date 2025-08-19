from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    ADMIN_API_KEY: str
    HTTP_PROXY: str | None = None
    HTTPS_PROXY: str | None = None
    DEVELOPMENT: bool

    class Config:
        env_file = ".env"


SETTINGS = Settings() # type: ignore
