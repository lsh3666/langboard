from abc import ABC, abstractmethod
from typing import Any, Callable, TypeVar


_TService = TypeVar("_TService", bound="BaseService", infer_variance=True)


class BaseService(ABC):
    @staticmethod
    @abstractmethod
    def name() -> str: ...

    def __init__(self, get_service: Callable, get_service_by_name: Callable):
        self._raw_get_service = get_service
        self._get_service_by_name = get_service_by_name

    def _get_service(self, service: type[_TService]) -> _TService:
        """This method is from :class:`ServiceFactory`.

        The purpose is to share services among services.
        """
        return self._raw_get_service(service)

    def _get_service_by_name(self, name: str) -> Any:
        """This method is from :class:`ServiceFactory`.

        The purpose is to share services among services.
        """
        return self._get_service_by_name(name)
