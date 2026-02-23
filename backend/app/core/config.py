# app/core/config.py
"""
DHCaaS Configuration Management
Centralized configuration using Pydantic Settings for type safety and validation.

Environment variables are loaded from .env file.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr, Field


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Uses pydantic-settings for automatic validation and type conversion.
    All settings can be overridden via environment variables.
    """
    
    # ===== Application Settings =====
    APP_NAME: str = "DHCaaS API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", description="Environment: development, staging, production")
    DEBUG: bool = Field(default=True, description="Enable debug mode")
    
    # ===== MongoDB Settings =====
    MONGODB_URL: str = Field(..., description="MongoDB connection string")
    MONGODB_DB_NAME: str = Field(default="dhcaas", description="MongoDB database name")
    
    # ===== JWT Authentication Settings =====
    JWT_SECRET_KEY: str = Field(
        default="temporary-secret-key-change-in-production-min-32-chars",
        description="Secret key for JWT encoding/decoding (min 256-bit)"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="JWT access token expiration time in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="JWT refresh token expiration time in days")
    
    # ===== Password Security Settings =====
    PASSWORD_MIN_LENGTH: int = Field(default=8, description="Minimum password length")
    PASSWORD_BCRYPT_ROUNDS: int = Field(default=12, description="Bcrypt hashing rounds (cost factor)")
    
    # ===== Default Admin Credentials =====
    DEFAULT_ADMIN_EMAIL: EmailStr = Field(default="admin@dhcaas.com", description="Default admin user email")
    DEFAULT_ADMIN_PASSWORD: str = Field(default="admin123", description="Default admin user password")
    DEFAULT_ADMIN_NAME: str = Field(default="System Administrator", description="Default admin full name")
    
    # ===== CORS Settings =====
    CORS_ORIGINS: list[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        description="Allowed CORS origins"
    )
    
    # ===== Security Settings =====
    ALLOWED_HOSTS: list[str] = Field(default=["*"], description="Allowed host headers")
    API_RATE_LIMIT: int = Field(default=1000, description="API rate limit (requests per hour)")
    
    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields in .env
    )
    
    # ===== Computed Properties =====
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT.lower() == "development"


# ===== Global Settings Instance =====
settings = Settings()


# ===== Helper Functions =====
def get_settings() -> Settings:
    """
    FastAPI dependency to inject settings.
    Usage: settings = Depends(get_settings)
    """
    return settings
