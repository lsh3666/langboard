from abc import ABC, abstractmethod
from typing import Any, TypeVar
from .BaseService import BaseService


_TService = TypeVar("_TService", bound=BaseService)


class ServiceFactory(ABC):
    def __init__(self):
        self._services: dict[str, BaseService] = {}

    @abstractmethod
    def close(self): ...

    def _create_or_get_service(self, service: type[_TService]) -> _TService:
        service_name = service.name()
        if service_name not in self._services:
            self._services[service_name] = service(self._create_or_get_service, self._create_or_get_service_by_name)

        return self._services[service_name]  # type: ignore

    def _create_or_get_service_by_name(self, name: str) -> Any:
        if not hasattr(self, name):
            raise ValueError(f"Service {name} not found")

        return self._services[name]
