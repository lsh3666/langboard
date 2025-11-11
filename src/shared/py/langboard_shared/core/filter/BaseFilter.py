from abc import ABC, abstractmethod
from typing import Any


class BaseFilter(ABC):
    def __init__(self):
        self._filtered: set[Any] = set()

    @abstractmethod
    def add(self, *args, **kwargs) -> Any:
        """Adds a data to be filtered.

        You can use as a decorator.
        """

    @abstractmethod
    def exists(self, *args, **kwargs) -> bool:
        """Checks if a data is in the filter."""
