from abc import ABC, abstractmethod
from fastapi import FastAPI
from starlette.routing import Match
from starlette.types import ASGIApp, Receive, Scope, Send
from .AppExceptionHandlingRoute import AppExceptionHandlingRoute


class BaseMiddleware(ABC):
    __auto_load__ = True

    def __init__(
        self,
        app: ASGIApp,
    ) -> None:
        self.app = app

    @abstractmethod
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None: ...

    def _get_endpoint(self, scope: Scope):
        app: FastAPI = scope.get("app", None)
        if not app:
            return None

        for route in app.routes:
            if not isinstance(route, AppExceptionHandlingRoute):
                continue

            matches, child_scope = route.matches(scope)
            if matches == Match.FULL:
                return child_scope["endpoint"]
        return None
