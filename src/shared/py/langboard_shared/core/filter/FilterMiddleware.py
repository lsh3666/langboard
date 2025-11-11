from typing import Literal, overload
from starlette.routing import BaseRoute, Match
from starlette.types import ASGIApp, Scope
from ..routing import AppExceptionHandlingRoute
from ..routing.BaseMiddleware import BaseMiddleware
from .BaseFilter import BaseFilter


class FilterMiddleware(BaseMiddleware):
    __auto_load__ = False

    def __init__(
        self,
        app: ASGIApp,
        routes: list[BaseRoute],
        filter: BaseFilter,
    ):
        super().__init__(app)
        self._routes = routes
        self._filter = filter

    @overload
    def should_filter(self, scope: Scope) -> tuple[Literal[True], Scope]: ...
    @overload
    def should_filter(self, scope: Scope) -> tuple[Literal[False], None]: ...
    def should_filter(self, scope: Scope) -> tuple[bool, Scope | None]:
        should_filter = False
        child_scope = None
        for route in self._routes:
            if not isinstance(route, AppExceptionHandlingRoute):
                continue

            matches, child_scope = route.matches(scope)
            if matches == Match.FULL:
                if self._filter.exists(child_scope["endpoint"]):
                    should_filter = True
                break
        return should_filter, child_scope
