from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    brevo_api_key: str | None = None
    mail_from: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
