from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    smtp_email: str | None = None
    smtp_password: str | None = None
    mail_username: str | None = None
    mail_password_reset: str | None = None
    mail_from: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
