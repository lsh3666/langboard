from enum import Enum
from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any, Callable, TypeVar, cast
from pydantic import BaseModel, SecretStr
from pydantic_core import PydanticUndefined as Undefined
from sqlalchemy import JSON, DateTime, func
from sqlalchemy.types import TEXT, VARCHAR, BigInteger, TypeDecorator
from sqlmodel import SQLModel
from ..types import SafeDateTime, SnowflakeID
from ..utils.Converter import json_default
from .ApiField import ApiField
from .Field import Field


TModelColumn = TypeVar("TModelColumn", bound=BaseModel)
TEnum = TypeVar("TEnum", bound=Enum)


class SnowflakeIDType(TypeDecorator):
    cache_ok = True
    impl = BigInteger

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, SnowflakeID):
            return int(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return SnowflakeID(value)
        return value


def SnowflakeIDField(
    primary_key: bool | None = None,
    foreign_key: type[SQLModel] | None = None,
    unique: bool | None = None,
    nullable: bool | None = None,
    index: bool | None = None,
    api_field: ApiField | None = None,
) -> Any:
    default_value = None if nullable and not primary_key else SnowflakeID(0)
    ondelete = Undefined
    foreign_model = foreign_key
    if isinstance(foreign_key, type) and issubclass(foreign_key, SQLModel):
        foreign_key = cast(Any, foreign_key).expr("id")
        ondelete = "CASCADE"
    else:
        foreign_key = cast(Any, Undefined)

    return Field(
        default=default_value,
        api_field=api_field,
        primary_key=primary_key if primary_key is not None else False,
        foreign_key=cast(Any, foreign_key),
        sa_type=SnowflakeIDType,
        sa_column_kwargs={"nullable": nullable if nullable is not None else True},
        nullable=nullable if nullable is not None else True,
        unique=unique if unique is not None else False,
        index=index if index is not None else False,
        ondelete=ondelete,
        schema_extra={"json_schema_extra": {"foreign_table": foreign_model}},
    )


def ModelColumnType(model_type: type[TModelColumn]):
    class _ModelColumnType(TypeDecorator[model_type]):
        impl = JSON
        cache_ok = True
        _model_type_class = model_type

        def process_bind_param(self, value: TModelColumn | None, dialect) -> str | None:
            if value is None:
                return None
            return value.model_dump_json()

        def process_result_value(self, value: dict | str | TModelColumn | None, dialect) -> TModelColumn | None:
            if value is None:
                return None

            if isinstance(value, dict):
                return model_type(**value)
            elif isinstance(value, str):
                return model_type.model_validate_json(value)
            else:
                return value

    return _ModelColumnType


def ModelColumnListType(model_type: type[TModelColumn]):
    class _ModelColumnListType(TypeDecorator[model_type]):
        impl = JSON
        cache_ok = True
        _model_type_class = model_type

        def process_bind_param(self, value: list[TModelColumn] | None, dialect) -> str | None:
            if value is None:
                return None
            return json_dumps([item.model_dump() for item in value], default=json_default)

        def process_result_value(
            self, value: str | list[TModelColumn] | list[dict] | None, dialect
        ) -> list[TModelColumn] | None:
            if value is None:
                return None

            if isinstance(value, list):
                return [model_type(**item) if isinstance(item, dict) else item for item in value]
            elif isinstance(value, str):
                loaded_value = json_loads(value)
                if isinstance(loaded_value, list):
                    return [model_type(**item) if isinstance(item, dict) else item for item in loaded_value]
                else:
                    return [model_type(**loaded_value)] if isinstance(loaded_value, dict) else [loaded_value]
            else:
                return value

    return _ModelColumnListType


class SecretStrType(TypeDecorator):
    impl = TEXT

    def process_bind_param(self, value: SecretStr, dialect) -> str:
        return value.get_secret_value()

    def process_result_value(self, value: str, dialect) -> SecretStr:
        return SecretStr(value)


def DateTimeField(
    default: Callable | None,
    nullable: bool,
    onupdate: bool = False,
    api_field: ApiField | None = None,
) -> Any:
    kwargs = {
        "nullable": nullable,
        "sa_type": DateTime(timezone=True),
        "sa_column_kwargs": {"server_default": func.now() if not nullable else None},
    }
    if onupdate:
        kwargs["sa_column_kwargs"]["onupdate"] = SafeDateTime.now
        kwargs["sa_column_kwargs"]["server_onupdate"] = func.now()

    if api_field:
        kwargs["api_field"] = api_field

    if default is None:
        return Field(default=None, **kwargs)
    else:
        return Field(default_factory=default, **kwargs)


class CSVType(TypeDecorator):
    impl = TEXT
    cache_ok = True

    def process_bind_param(self, value: list[str] | None, dialect) -> str | None:
        if value is None:
            return None
        return ",".join([chunk for chunk in value if chunk])

    def process_result_value(self, value: str, dialect) -> list[str] | None:
        if value is None:
            return None
        chunks = value.split(",")
        return [chunk for chunk in chunks if chunk]


def EnumLikeType(enum_type: type[TEnum]):
    class _EnumLikeType(TypeDecorator[enum_type]):
        impl = VARCHAR
        cache_ok = True
        _enum_type_class = enum_type

        def process_bind_param(self, value: TEnum | None, dialect) -> str | None:
            if value is None:
                return None
            return value.value

        def process_result_value(self, value: str | None, dialect) -> TEnum | None:
            if value in enum_type.__members__:
                return enum_type[cast(str, value)]
            elif value in enum_type._value2member_map_:
                return enum_type(value)
            return None

    return _EnumLikeType
