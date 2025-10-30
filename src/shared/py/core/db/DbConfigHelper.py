from typing import Any, Literal
from sqlalchemy import NullPool, StaticPool
from ..Env import Env
from ..utils.decorators import staticclass


@staticclass
class DbConfigHelper:
    @staticmethod
    def create_config(url: str) -> dict[str, Any]:
        driver_type = DbConfigHelper.get_driver_type(url)
        if driver_type == "sqlite":
            return {
                "connect_args": {
                    "check_same_thread": False,
                    "timeout": Env.DB_TIMEOUT,
                },
                "poolclass": StaticPool,
                "pool_pre_ping": True,
            }

        if driver_type == "postgresql":
            return {
                "connect_args": {
                    "conninfo": f"application_name={Env.PROJECT_NAME}_{Env.WORKER}&timeout={Env.DB_TIMEOUT}&statement_cache_size=0&tcp_user_timeout={Env.DB_TCP_USER_TIMEOUT}",
                },
                "poolclass": NullPool,
                "pool_pre_ping": True,
            }

        return {}

    @staticmethod
    def get_sanitized_driver(url: str) -> str:
        splitted = url.split("://", maxsplit=1)
        driver_type = DbConfigHelper.get_driver_type(url)
        if driver_type == "sqlite":
            return f"sqlite://{splitted[1]}"
        if driver_type == "postgresql":
            return f"postgresql+psycopg://{splitted[1]}"
        return url

    @staticmethod
    def get_driver_type(url: str) -> Literal["sqlite", "postgresql"] | str:
        splitted = url.split("://", maxsplit=1)
        driver = splitted[0]
        if driver == "sqlite":
            return "sqlite"
        if driver in ("postgresql", "postgres"):
            return "postgresql"
        return driver
