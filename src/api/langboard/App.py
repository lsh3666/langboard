from json import loads as json_loads
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from langboard_shared.ai import BotScheduleHelper
from langboard_shared.core.routing import AppExceptionHandlingRoute, AppRouter, BaseMiddleware
from langboard_shared.core.security import AuthSecurity
from langboard_shared.Env import Env
from langboard_shared.FastAPIAppConfig import FastAPIAppConfig
from .Constants import APP_CONFIG_FILE
from .Loader import ModuleLoader
from .middlewares import AuthMiddleware, RoleMiddleware


class App:
    api: FastAPI

    def __init__(self):
        self.app_config = FastAPIAppConfig(APP_CONFIG_FILE)
        self.config = self.app_config.load()
        self.api = FastAPI(debug=True)
        self._init_api_middlewares()
        self._init_api_routes()

        AppRouter.set_openapi_schema(self.api)
        AuthSecurity.set_openapi_schema(self.api)
        AppRouter.set_app(self.api)
        AppRouter.create_schema_files(Env.SCHEMA_DIR)

        self.api.openapi = self._openapi_json

    def create(self):
        AppRouter.set_app(self.api)
        BotScheduleHelper.utils.reload_cron()
        self.app_config.set_restarting(True)
        return self.api

    def _init_api_middlewares(self):
        origins = [Env.PUBLIC_UI_URL]
        self.api.add_middleware(RoleMiddleware, routes=self.api.routes)
        self.api.add_middleware(AuthMiddleware, routes=self.api.routes)
        self.api.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=5)
        self.api.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
            allow_headers=[
                "Accept",
                "Referer",
                "Accept-Encoding",
                "Accept-Language",
                "Content-Encoding",
                "Content-Language",
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "User-Agent",
                "X-Forwarded-Proto",
                "X-Forwarded-Host",
                "X-Real-IP",
                AuthSecurity.IP_HEADER,
            ],
        )

        middleware_modules = ModuleLoader.load(
            "middlewares", "Middleware", BaseMiddleware, not self.config.is_restarting
        )
        for module in middleware_modules.values():
            for middleware in module:
                if middleware.__auto_load__:
                    self.api.add_middleware(middleware)

    def _init_api_routes(self):
        self.api.router.route_class = AppExceptionHandlingRoute
        ModuleLoader.load("routes", "Api", log=not self.config.is_restarting)
        self.api.include_router(AppRouter.api)

    def _openapi_json(self):
        with open(Env.SCHEMA_DIR / AppRouter.open_api_schema_file, "r") as f:
            content = f.read()
        return json_loads(content)
