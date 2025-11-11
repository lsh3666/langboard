from __future__ import annotations
import asyncio
import logging
import os
import socket
import ssl
import sys
from configparser import RawConfigParser
from typing import IO, Any, Awaitable, Callable
import click
from uvicorn._types import ASGIApplication
from uvicorn.config import (
    LOGGING_CONFIG,
    SSL_PROTOCOL_VERSION,
    Config,
    HTTPProtocolType,
    InterfaceType,
    LifespanType,
    LoopFactoryType,
    WSProtocolType,
)
from .server import Server
from .supervisors import ChangeReload, Multiprocess


STARTUP_FAILURE = 3

logger = logging.getLogger("uvicorn.error")


def create_config(
    app: ASGIApplication | Callable[..., Any] | str,
    *,
    host: str = "127.0.0.1",
    port: int = 8000,
    uds: str | None = None,
    fd: int | None = None,
    loop: LoopFactoryType | str = "auto",
    http: type[asyncio.Protocol] | HTTPProtocolType | str = "auto",
    ws: type[asyncio.Protocol] | WSProtocolType | str = "auto",
    ws_max_size: int = 16 * 1024 * 1024,
    ws_max_queue: int = 32,
    ws_ping_interval: float | None = 20.0,
    ws_ping_timeout: float | None = 20.0,
    ws_per_message_deflate: bool = True,
    lifespan: LifespanType = "auto",
    env_file: str | os.PathLike[str] | None = None,
    log_config: dict[str, Any] | str | RawConfigParser | IO[Any] | None = LOGGING_CONFIG,
    log_level: str | int | None = None,
    access_log: bool = True,
    use_colors: bool | None = None,
    interface: InterfaceType = "auto",
    reload: bool = False,
    reload_dirs: list[str] | str | None = None,
    reload_delay: float = 0.25,
    reload_includes: list[str] | str | None = None,
    reload_excludes: list[str] | str | None = None,
    workers: int | None = None,
    proxy_headers: bool = True,
    server_header: bool = True,
    date_header: bool = True,
    forwarded_allow_ips: list[str] | str | None = None,
    root_path: str = "",
    limit_concurrency: int | None = None,
    limit_max_requests: int | None = None,
    backlog: int = 2048,
    timeout_keep_alive: int = 30,
    timeout_notify: int = 30,
    timeout_graceful_shutdown: int | None = None,
    timeout_worker_healthcheck: int = 30,
    callback_notify: Callable[..., Awaitable[None]] | None = None,
    ssl_keyfile: str | os.PathLike[str] | None = None,
    ssl_certfile: str | os.PathLike[str] | None = None,
    ssl_keyfile_password: str | None = None,
    ssl_version: int = SSL_PROTOCOL_VERSION,
    ssl_cert_reqs: int = ssl.CERT_NONE,
    ssl_ca_certs: str | os.PathLike[str] | None = None,
    ssl_ciphers: str = "TLSv1",
    headers: list[tuple[str, str]] | None = None,
    app_dir: str | None = None,
    factory: bool = False,
    h11_max_incomplete_event_size: int | None = None,
) -> Config:
    if app_dir is not None:
        sys.path.insert(0, app_dir)

    def bind_socket(self) -> socket.socket:
        logger_args: list[str | int]
        if self.uds:  # pragma: py-win32
            path = self.uds
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)  # type: ignore
            try:
                sock.bind(path)
                uds_perms = 0o666
                os.chmod(self.uds, uds_perms)
            except OSError as exc:  # pragma: full coverage
                logger.error(exc)
                sys.exit(1)

            message = "Running on unix socket %s (Press CTRL+C to quit)"
            sock_name_format = "%s"
            color_message = "Running on " + click.style(sock_name_format, bold=True) + " (Press CTRL+C to quit)"
            logger_args = [self.uds]
        elif self.fd:  # pragma: py-win32
            sock = socket.fromfd(self.fd, socket.AF_UNIX, socket.SOCK_STREAM)  # type: ignore
            message = "Running on socket %s (Press CTRL+C to quit)"
            fd_name_format = "%s"
            color_message = "Running on " + click.style(fd_name_format, bold=True) + " (Press CTRL+C to quit)"
            logger_args = [sock.getsockname()]
        else:
            family = socket.AF_INET
            addr_format = "%s://%s:%d"

            if self.host and ":" in self.host:  # pragma: full coverage
                # It's an IPv6 address.
                family = socket.AF_INET6
                addr_format = "%s://[%s]:%d"

            sock = socket.socket(family=family)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((self.host, self.port))
            except OSError as exc:  # pragma: full coverage
                logger.error(exc)
                sys.exit(1)

            message = f"Running on {addr_format} (Press CTRL+C to quit)"
            color_message = "Running on " + click.style(addr_format, bold=True) + " (Press CTRL+C to quit)"
            protocol_name = "https" if self.is_ssl else "http"
            logger_args = [protocol_name, self.host, sock.getsockname()[1]]
        logger.info(message, *logger_args, extra={"color_message": color_message})
        sock.set_inheritable(True)
        return sock

    Config.bind_socket = bind_socket

    config = Config(
        app,
        host=host,
        port=port,
        uds=uds,
        fd=fd,
        loop=loop,
        http=http,
        ws=ws,
        ws_max_size=ws_max_size,
        ws_max_queue=ws_max_queue,
        ws_ping_interval=ws_ping_interval,
        ws_ping_timeout=ws_ping_timeout,
        ws_per_message_deflate=ws_per_message_deflate,
        lifespan=lifespan,
        env_file=env_file,
        log_config=log_config,
        log_level=log_level,
        access_log=access_log,
        use_colors=use_colors,
        interface=interface,
        reload=reload,
        reload_dirs=reload_dirs,
        reload_delay=reload_delay,
        reload_includes=reload_includes,
        reload_excludes=reload_excludes,
        workers=workers,
        proxy_headers=proxy_headers,
        server_header=server_header,
        date_header=date_header,
        forwarded_allow_ips=forwarded_allow_ips,
        root_path=root_path,
        limit_concurrency=limit_concurrency,
        limit_max_requests=limit_max_requests,
        backlog=backlog,
        timeout_keep_alive=timeout_keep_alive,
        timeout_notify=timeout_notify,
        timeout_graceful_shutdown=timeout_graceful_shutdown,
        timeout_worker_healthcheck=timeout_worker_healthcheck,
        callback_notify=callback_notify,
        ssl_keyfile=ssl_keyfile,
        ssl_certfile=ssl_certfile,
        ssl_keyfile_password=ssl_keyfile_password,
        ssl_version=ssl_version,
        ssl_cert_reqs=ssl_cert_reqs,
        ssl_ca_certs=ssl_ca_certs,
        ssl_ciphers=ssl_ciphers,
        headers=headers,
        factory=factory,
        h11_max_incomplete_event_size=h11_max_incomplete_event_size,
    )

    return config


def run(config: Config) -> None:
    server = Server(config=config)

    try:
        if config.should_reload:
            sock = config.bind_socket()
            ChangeReload(config, target=server.run, sockets=[sock]).run()
        elif config.workers > 1:
            sock = config.bind_socket()
            Multiprocess(config, target=server.run, sockets=[sock]).run()
        else:
            server.run()
    except KeyboardInterrupt:
        pass  # pragma: full coverage
    except Exception as exc:
        logger.error("Error starting server: %s", exc, exc_info=True)
        sys.exit(STARTUP_FAILURE)
    finally:
        if config.uds and os.path.exists(config.uds):
            os.remove(config.uds)  # pragma: py-win32

    if not server.started and not config.should_reload and config.workers == 1:
        sys.exit(STARTUP_FAILURE)
