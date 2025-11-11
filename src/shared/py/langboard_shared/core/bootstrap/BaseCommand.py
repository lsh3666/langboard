from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from pydantic import BaseModel


_TOption = TypeVar("_TOption", bound="BaseCommandOptions")


class BaseCommandOptions(ABC, BaseModel):
    pass


class BaseCommand(ABC, Generic[_TOption]):
    @staticmethod
    @abstractmethod
    def is_only_in_dev() -> bool: ...

    @property
    @abstractmethod
    def option_class(self) -> type[_TOption]: ...

    @property
    @abstractmethod
    def command(self) -> str: ...

    @property
    @abstractmethod
    def positional_name(self) -> str: ...

    @property
    @abstractmethod
    def description(self) -> str: ...

    @property
    @abstractmethod
    def choices(self) -> list[str] | None: ...

    @property
    def choices_description(self) -> list[str] | None:
        return self.choices

    @property
    @abstractmethod
    def store_type(self) -> type[bool] | type[str]: ...

    def __init__(self, *args, **kwargs) -> None:
        self._args = args
        self._kwargs = kwargs

    @abstractmethod
    def execute(self, *args, **kwargs) -> None: ...

    def _cast_option(self, options: dict) -> _TOption:
        return self.option_class(**options)
