import os
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # 1. Application Runtime
    ENVIRONMENT: str = "development"
    APP_TITLE: str = "ChatSphare API"
    APP_VERSION: str = "1.0.0"
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    # 2. Supabase Connection
    SUPABASE_URL: str = Field(default="", description="Supabase Project URL")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase Anon Key")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", description="Supabase Service Role Key")
    SUPABASE_JWT_SECRET: str = Field(default="", description="Supabase JWT Secret")

    # 3. CORS & Frontend Integration
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    FRONTEND_URL: str = "http://localhost:5173"
    REQUIRE_EMAIL_VERIFICATION: bool = False

    # 4. Session Cookies & Security
    COOKIE_SECURE: bool = False
    COOKIE_SAME_SITE: str = "lax"
    COOKIE_MAX_AGE: int = 2592000  # 30 days in seconds
    CAPTCHA_SECRET_KEY: str = "chatsphare-server-sensitive-captcha-secret-salt-2026"

    # 5. LLM API Keys & Model Defaults
    LLM_PROVIDER: str = "mistral"
    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    OPENAI_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "openrouter/auto"

    # 6. Firebase Admin
    FIREBASE_PROJECT_ID: str = "chatsphare-app"
    FIREBASE_CREDENTIALS_PATH: str = ""

    # 7. Cloud & AWS
    AWS_REGION: str = "ap-south-1"
    AWS_DEFAULT_REGION: str = "ap-south-1"

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
