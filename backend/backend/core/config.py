from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Zoho Desk
    ZOHO_ENABLED: bool = True
    ZOHO_ACCOUNTS_DOMAIN: str = "com"

    ZOHO_CLIENT_ID: str = ""
    ZOHO_CLIENT_SECRET: str = ""
    ZOHO_REFRESH_TOKEN: str = ""

    ZOHO_DESK_ORG_ID: str = ""
    ZOHO_DESK_BASE_URL: str = "https://desk.zoho.com"
    ZOHO_DESK_DEPARTMENT_ID: str = ""

    ZOHO_DESK_DEFAULT_PRIORITY: str = "High"
    ZOHO_DESK_DEFAULT_STATUS: str = "Open"
    ZOHO_TIMEOUT_S: int = 10


settings = Settings()
