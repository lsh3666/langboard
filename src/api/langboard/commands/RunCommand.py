from ssl import CERT_NONE
from typing import cast
from core.bootstrap import BaseCommand, BaseCommandOptions
from core.Env import Env
from pydantic import Field
from uvicorn.config import SSL_PROTOCOL_VERSION, LifespanType


class RunCommandOptions(BaseCommandOptions):
    uds: str = cast(str, Field(default=None, description="Bind to a UNIX domain socket"))
    lifespan: LifespanType = Field(default="auto", description="Lifespan type [auto, on, off]", short="lfsp")  # type: ignore
    ssl_keyfile: str = Field(default=None, description="SSL key file", short="ssl-key")  # type: ignore
    ssl_certfile: str = Field(default=None, description="SSL certificate file", short="ssl-cert")  # type: ignore
    ssl_keyfile_password: str = Field(default=None, description="SSL keyfile password", short="ssl-pass")  # type: ignore
    ssl_version: int = Field(default=SSL_PROTOCOL_VERSION, description="SSL version", short="ssl-ver")  # type: ignore
    ssl_cert_reqs: int = Field(default=CERT_NONE, description="SSL certificate requirements", short="ssl-reqs")  # type: ignore
    ssl_ca_certs: str = Field(default=None, description="CA certificates file", short="ssl-ca")  # type: ignore
    ssl_ciphers: str = Field(
        default="TLSv1", description="Ciphers to use (see stdlib ssl module's) (default: TLSv1)", short="ssl-cp"
    )  # type: ignore
    timeout_keep_alive: int = Field(default=30, description="Keep-alive timeout in seconds", short="tka")  # type: ignore
    healthcheck_interval: int = Field(default=30, description="Healthcheck interval in seconds", short="hci")  # type: ignore
    worker: bool = Field(default=False, description="Run as a worker")
    if not Env.IS_EXECUTABLE:
        watch: bool = Field(default=False, description="Watch for changes", short="w")  # type: ignore

    def create_ssl_options(self) -> dict:
        return {
            "keyfile": self.ssl_keyfile,
            "certfile": self.ssl_certfile,
            "keyfile_password": self.ssl_keyfile_password,
            "version": self.ssl_version,
            "cert_reqs": self.ssl_cert_reqs,
            "ca_certs": self.ssl_ca_certs,
            "ciphers": self.ssl_ciphers,
        }


class RunCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return False

    @property
    def option_class(self) -> type[RunCommandOptions]:
        return RunCommandOptions

    @property
    def command(self) -> str:
        return "run"

    @property
    def positional_name(self) -> str:
        return ""

    @property
    def description(self) -> str:
        return "Run the server"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return bool

    def execute(self, options: RunCommandOptions) -> None:
        self._kwargs["run_app"](options)
