from json import loads as json_loads
from time import sleep
from typing import cast
from core.db import DbSession, SqlBuilder
from core.Env import Env
from core.FastAPIAppConfig import FastAPIAppConfig
from core.routing import AppExceptionHandlingRoute, AppRouter, BaseMiddleware
from core.security import AuthSecurity
from core.types import SafeDateTime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from models import User, UserProfile
from pydantic import SecretStr
from .ai import BotScheduleHelper
from .Constants import APP_CONFIG_FILE, SCHEMA_DIR
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
        self._init_admin()

        AppRouter.set_openapi_schema(self.api)
        AuthSecurity.set_openapi_schema(self.api)
        AppRouter.create_schema_file(self.api, SCHEMA_DIR / "openapi.json")
        AppRouter.set_app(self.api)

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

    def _init_admin(self):
        user_count = 0
        with DbSession.use(readonly=True) as db:
            result = db.exec(SqlBuilder.select.count(User, User.id).where(User.is_admin == True))  # noqa
            user_count = result.first()

        if user_count:
            return

        admin = User(
            firstname="Admin",
            lastname="User",
            email=Env.ADMIN_EMAIL,
            password=cast(SecretStr, Env.ADMIN_PASSWORD),
            username="admin",
            is_admin=True,
            activated_at=SafeDateTime.now(),
        )
        with DbSession.use(readonly=False) as db:
            db.insert(admin)

        if admin.is_new():
            self._init_admin()
            return

        admin_profile = None
        while not admin_profile:
            with DbSession.use(readonly=False) as db:
                admin_profile = UserProfile(user_id=admin.id, industry="", purpose="")
                db.insert(admin_profile)
            sleep(1)

    def _openapi_json(self):
        with open(SCHEMA_DIR / "openapi.json", "r") as f:
            content = f.read()
        return json_loads(content)
