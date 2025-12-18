from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # ---------- DATABASE ----------
    MYSQL_URL: str = Field(..., env="MYSQL_URL")
    MONGO_URL: str = Field(..., env="MONGO_URL")
    MONGO_DB: str = Field(..., env="MONGO_DB")

    # ---------- JWT ----------
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRE_MINUTES: int = Field(default=60, env="JWT_EXPIRE_MINUTES")

    class Config:
        env_file = ".env"
        extra = "ignore"   # VERY IMPORTANT 🔥


settings = Settings()
