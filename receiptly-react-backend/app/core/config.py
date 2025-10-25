"""
Configuration management for the Receiptly backend application.
"""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    
    # Database
    database_url: str = Field(..., description="PostgreSQL database connection URL")
    
    # Server
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    debug: bool = Field(default=True, description="Enable debug mode")
    
    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173,https://receiptly.leonberkemeier.de",
        description="Allowed CORS origins as comma-separated string",
    )
    
    # Authentication
    secret_key: str = Field(
        default="your-secret-key-here-change-in-production-make-it-long-and-random",
        description="JWT secret key for authentication",
    )
    
    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()