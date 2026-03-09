from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    smtp_email: str = "nexuserp28@gmail.com"
    smtp_password: str = "hnixuhyzwhjsgqqq"
    mail_username: str = "nexuserp28@gmail.com"
    mail_password_reset: str = "mkixsyadjfjbdcwm"
    mail_from: str = "nexuserp28@gmail.com"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
