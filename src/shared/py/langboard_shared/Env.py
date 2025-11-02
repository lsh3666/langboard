from enum import Enum
from importlib.metadata import version
from os import environ
from os.path import dirname
from pathlib import Path
from typing import Any, Literal, cast
from dotenv import load_dotenv
from .core.utils.decorators import class_instance, thread_safe_singleton


expected_env_paths = ["../../../../../", "../../../../", "../../../", "../../", "../", "./"]
for env_path in expected_env_paths:
    env_path = Path(env_path) / ".env"
    if not env_path.is_file():
        continue
    load_dotenv(env_path)
expected_env_paths.clear()


@class_instance()
@thread_safe_singleton
class Env:
    @property
    def IS_EXECUTABLE(self) -> bool:
        return self.__get_from_cache("IS_EXECUTABLE", "false") == "true"

    @property
    def ENVIRONMENT(self) -> Literal["development", "production"]:
        return cast(Any, self.__get_from_cache("ENVIRONMENT", "development"))

    @property
    def PROJECT_NAME(self) -> str:
        return self.__get_from_cache("PROJECT_NAME")

    @property
    def PROJECT_SHORT_NAME(self) -> str:
        return self.__get_from_cache("PROJECT_SHORT_NAME", self.PROJECT_NAME)

    @property
    def PROJECT_VERSION(self) -> str:
        return version(self.PROJECT_NAME)

    @property
    def ADMIN_EMAIL(self) -> str:
        return self.__get_from_cache("ADMIN_EMAIL")

    @property
    def ADMIN_PASSWORD(self) -> str:
        return self.__get_from_cache("ADMIN_PASSWORD")

    @property
    def API_PORT(self) -> int:
        return int(self.__get_from_cache("API_PORT", "5381"))

    @property
    def UI_PORT(self) -> int:
        return int(self.__get_from_cache("UI_PORT", "5173"))

    @property
    def API_URL(self) -> str:
        return self.__get_from_cache("API_URL", f"http://localhost:{self.API_PORT}")

    @property
    def PUBLIC_UI_URL(self) -> str:
        return (
            self.__get_from_cache("PUBLIC_UI_URL", f"http://localhost:{self.UI_PORT}")
            if self.ENVIRONMENT != "development"
            else f"http://localhost:{self.UI_PORT}"
        )

    @property
    def UI_REDIRECT_URL(self) -> str:
        return f"{self.PUBLIC_UI_URL}/redirect"

    @property
    def OLLAMA_API_URL(self) -> str | None:
        return self.__get_from_cache("OLLAMA_API_URL", None)

    @property
    def AI_REQUEST_TIMEOUT(self) -> int:
        return int(self.__get_from_cache("AI_REQUEST_TIMEOUT", "120"))

    @property
    def AI_REQUEST_TRIALS(self) -> int:
        return int(self.__get_from_cache("AI_REQUEST_TRIALS", "5"))

    @property
    def MAIN_DATABASE_URL(self) -> str:
        return self.__get_from_cache("MAIN_DATABASE_URL", f"sqlite:///{self.PROJECT_NAME}.db")

    @property
    def READONLY_DATABASE_URL(self) -> str:
        return self.__get_from_cache("READONLY_DATABASE_URL", self.MAIN_DATABASE_URL)

    @property
    def DB_TIMEOUT(self) -> int:
        return int(self.__get_from_cache("DB_TIMEOUT", "120"))

    @property
    def DB_TCP_USER_TIMEOUT(self) -> int:
        return int(self.__get_from_cache("DB_TCP_USER_TIMEOUT", "1000"))

    @property
    def TERMINAL_LOGGING_LEVEL(self) -> str:
        return self.__get_from_cache("TERMINAL_LOGGING_LEVEL", "AUTO").upper()

    @property
    def FILE_LOGGING_LEVEL(self) -> str:
        return self.__get_from_cache("FILE_LOGGING_LEVEL", "AUTO").upper()

    @property
    def SENTRY_DSN(self) -> str:
        return self.__get_from_cache("SENTRY_DSN")

    @property
    def BROADCAST_TYPE(self) -> Literal["in-memory", "kafka"]:
        broadcast_type = cast(Any, self.__get_from_cache("BROADCAST_TYPE", "in-memory"))
        _available_broadcast_types = {"in-memory", "kafka"}
        if broadcast_type not in _available_broadcast_types:
            raise ValueError(f"Invalid broadcast type: {broadcast_type}. Must be one of {_available_broadcast_types}")
        return broadcast_type

    @property
    def BROADCAST_URLS(self) -> list[str]:
        urls = self.__get_from_cache("BROADCAST_URLS", "")
        return urls.split(",") if urls else []

    @property
    def CACHE_TYPE(self) -> Literal["in-memory", "redis"]:
        cache_type = cast(Any, self.__get_from_cache("CACHE_TYPE", "in-memory"))
        _available_cache_types = {"in-memory", "redis"}
        if cache_type not in _available_cache_types:
            raise ValueError(f"Invalid cache type: {cache_type}. Must be one of {_available_cache_types}")
        return cache_type

    @property
    def CACHE_URL(self) -> str:
        return self.__get_from_cache("CACHE_URL", "")

    @property
    def COMMON_SECRET_KEY(self) -> str:
        return self.__get_from_cache("COMMON_SECRET_KEY", f"{self.PROJECT_NAME}_common_key")

    @property
    def JWT_SECRET_KEY(self) -> str:
        return self.__get_from_cache("JWT_SECRET_KEY", f"{self.PROJECT_NAME}_secret_key")

    @property
    def JWT_ALGORITHM(self) -> str:
        return self.__get_from_cache("JWT_ALGORITHM", "HS256")

    @property
    def JWT_AT_EXPIRATION(self) -> int:
        return int(self.__get_from_cache("JWT_AT_EXPIRATION", 60 * 60 * 3))  # 3 hours for default

    @property
    def JWT_RT_EXPIRATION(self) -> int:
        return int(self.__get_from_cache("JWT_RT_EXPIRATION", 30))  # 30 days for default

    @property
    def REFRESH_TOKEN_NAME(self) -> str:
        return f"refresh_token_{self.PROJECT_SHORT_NAME}"

    @property
    def S3_ACCESS_KEY_ID(self) -> str:
        return self.__get_from_cache("S3_ACCESS_KEY_ID")

    @property
    def S3_SECRET_ACCESS_KEY(self) -> str:
        return self.__get_from_cache("S3_SECRET_ACCESS_KEY")

    @property
    def S3_REGION_NAME(self) -> str:
        return self.__get_from_cache("S3_REGION_NAME", "us-east-1")

    @property
    def S3_BUCKET_NAME(self) -> str:
        return self.__get_from_cache("S3_BUCKET_NAME", self.PROJECT_NAME)

    @property
    def MAIL_FROM(self) -> str:
        return self.__get_from_cache("MAIL_FROM")

    @property
    def MAIL_FROM_NAME(self) -> str:
        return self.__get_from_cache("MAIL_FROM_NAME", f"{self.PROJECT_NAME.capitalize()} Team")

    @property
    def MAIL_USERNAME(self) -> str:
        return self.__get_from_cache("MAIL_USERNAME", "")

    @property
    def MAIL_PASSWORD(self) -> str:
        return self.__get_from_cache("MAIL_PASSWORD", "")

    @property
    def MAIL_SERVER(self) -> str:
        return self.__get_from_cache("MAIL_SERVER")

    @property
    def MAIL_PORT(self) -> int:
        return int(self.__get_from_cache("MAIL_PORT", "587"))

    @property
    def MAIL_STARTTLS(self) -> bool:
        return self.__get_from_cache("MAIL_STARTTLS", "true") == "true"

    @property
    def MAIL_SSL_TLS(self) -> bool:
        return self.__get_from_cache("MAIL_SSL_TLS", "false") == "true"

    @property
    def FLOWS_PORT(self) -> int:
        return int(self.__get_from_cache("FLOWS_PORT", "5019"))

    @property
    def DEFAULT_FLOWS_URL(self) -> str:
        return self.__get_from_cache("DEFAULT_FLOWS_URL", "http://127.0.0.1:5019")

    @property
    def WORKER(self) -> str:
        return self.__get_from_cache("WORKER", "main")

    @property
    def ROOT_DIR(self) -> Path:
        return Path(dirname(__file__)).parent.parent.parent.parent

    @property
    def DATA_DIR(self) -> Path:
        data_dir = self.ROOT_DIR / "local" if not self.IS_EXECUTABLE else self.ROOT_DIR / "data"
        data_dir.mkdir(exist_ok=True)
        return data_dir

    @property
    def SCHEMA_DIR(self) -> Path:
        schema_dir = self.DATA_DIR / "schemas"
        schema_dir.mkdir(parents=True, exist_ok=True)
        return schema_dir

    @property
    def LOCAL_STORAGE_DIR(self) -> Path:
        local_storage_dir = self.DATA_DIR / "uploads"
        local_storage_dir.mkdir(parents=True, exist_ok=True)
        return local_storage_dir

    @property
    def CRON_TAB_FILE(self) -> Path:
        cron_tab_file = self.DATA_DIR / "cron.tab"
        return cron_tab_file

    @property
    def CACHE_DIR(self) -> Path:
        cache_dir = self.DATA_DIR / "cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir

    @property
    def LOGGING_DIR(self) -> Path:
        logging_dir = Path(Env.get_from_env("LOGGING_DIR", Env.DATA_DIR / "logs"))
        logging_dir.mkdir(parents=True, exist_ok=True)
        return logging_dir

    def __init__(self):
        self.__envs = {}

    def get_from_env(self, name: str, default: Any = None) -> Any | str:
        is_default = name not in environ or not environ[name]
        return default if is_default else environ[name]

    def update_env(self, name: str, value: Any) -> None:
        if not hasattr(self, name):
            raise AttributeError(f"Environment variable '{name}' does not exist.")

        self.__envs[name] = value

    def __get_from_cache(self, name: str, default: Any = None) -> Any | str:
        if name not in self.__envs:
            self.__envs[name] = self.get_from_env(name, default)
        return self.__envs[name]


# UI query names
class UI_QUERY_NAMES(Enum):
    SUB_EMAIL_VERIFY_TOKEN = "bEvt"
    RECOVERY_TOKEN = "rtK"
    SIGN_UP_ACTIVATE_TOKEN = "sAVk"
    PROJCT_INVITATION_TOKEN = "PikQ"
    BOARD = "bp"
    BOARD_CARD = "BpC"
    BOARD_CARD_CHUNK = "BpCC"
    BOARD_WIKI = "bPw"
    BOARD_WIKI_CHUNK = "BpWc"
