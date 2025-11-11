from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, ClassVar, Literal, TypeVar, overload
from pydantic import BaseModel, SecretStr, model_serializer
from sqlalchemy import MetaData
from sqlalchemy.orm import declared_attr, registry
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlmodel import SQLModel
from ..types import SafeDateTime, SnowflakeID
from ..utils.StringCase import StringCase
from .ApiField import ApiField
from .ColumnTypes import DateTimeField, SnowflakeIDField
from .Field import Field


_TColumnType = TypeVar("_TColumnType")

SQLModel.metadata = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_`%(constraint_name)s`",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)
default_registry = registry()


class BaseSqlModel(ABC, SQLModel, registry=default_registry):
    """Bases for all SQL models in the application inherited from :class:`SQLModel`."""

    __changes__: ClassVar[dict[str, dict[str, Any]]] = {}
    __pydantic_post_init__ = "model_post_init"

    id: SnowflakeID = SnowflakeIDField(primary_key=True, api_field=ApiField(name="uid"))
    created_at: SafeDateTime = DateTimeField(default=SafeDateTime.now, nullable=False, api_field=ApiField())
    updated_at: SafeDateTime = DateTimeField(
        default=SafeDateTime.now, nullable=False, onupdate=True, api_field=ApiField()
    )

    @property
    def __change_key(self) -> str:
        return f"{self.__tablename__}:{self.id}"

    @property
    def __changes(self) -> dict[str, Any]:
        return self.__changes__[self.__change_key] if self.__change_key in self.__changes__ else {}

    @property
    def changes(self) -> dict[str, Any]:
        """Get the changes made to the object."""
        if not isinstance(self, BaseSqlModel) or not self.__changes:
            return {}
        return {**self.__changes}

    @property
    def changes_dict(self) -> dict[str, Any]:
        """Get the changed values as a dictionary if the object is a model."""
        if not isinstance(self, BaseSqlModel) or not self.__changes:
            return {}
        changed_values = {}
        for key, value in self.__changes.items():
            if isinstance(value, SecretStr):
                value = value.get_secret_value()
            elif isinstance(value, BaseModel):
                value = value.model_dump()
            changed_values[key] = value
        return changed_values

    @declared_attr.directive
    def __tablename__(cls) -> str:
        return StringCase(cls.__name__).to_snake()

    def __str__(self) -> str:
        return self._repr(self._get_repr_keys())

    def __repr__(self) -> str:
        return str(self)

    def __eq__(self, target: object) -> bool:
        return isinstance(target, self.__class__) and self.id != 0 and self.id == target.id

    def __ne__(self, target: object) -> bool:
        return not self.__eq__(target)

    def __init__(__pydantic_self__, **data: Any) -> None:  # type: ignore
        if isinstance(__pydantic_self__, BaseSqlModel):
            __pydantic_self__.model_post_init()
        super().__init__(**data)

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "_sa_instance_state":
            if not hasattr(self, "_initiated"):
                object.__setattr__(self, "_initiated", True)
            super().__setattr__(name, value)
            return

        if not isinstance(self, BaseSqlModel) or not hasattr(self, "_initiated") or name == "_initiated":
            super().__setattr__(name, value)
            return

        if not self.is_new() and name in self.model_fields.keys():
            old_value = getattr(self, name)
            if self.__change_key not in self.__changes__:
                self.__changes__[self.__change_key] = {}
            if old_value != value:
                if name not in self.__changes:
                    self.__changes[name] = old_value
                elif self.__changes[name] == value:
                    del self.__changes[name]
        super().__setattr__(name, value)

    @classmethod
    def column(cls, name: str, _: type[_TColumnType] | None = None) -> InstrumentedAttribute[_TColumnType]:
        """Cast a column to :class:`sqlalchemy.orm.attributes.InstrumentedAttribute`.

        E.g.::

            ModelClass.column("column_name")
            User.column("id")
            ModelClass.column("column_name", int)
            User.column("id", int | None)

        :param name: The column name existing in the model.
        :param _: The type of the column. If provided, it will be assigned to :class:`sqlalchemy.orm.attributes.InstrumentedAttribute`.
        """
        if not isinstance(cls, type) or not issubclass(cls, BaseSqlModel):  # type: ignore
            return None  # type: ignore
        column = getattr(cls, name, None)
        if column is None:
            raise ValueError(f"Column {name} not found in {cls.__name__}")
        if not isinstance(column, InstrumentedAttribute):
            raise ValueError(f'Must use {cls.__name__}.column("{name}")')
        return column

    @classmethod
    def expr(cls, name: str) -> str:
        """Get the column expression from a model column.

        E.g.::

            ModelClass.expr("column_name")
            User.expr("id")

        :param name: The column name existing in the model.
        """
        column = cls.column(name)
        if column is None:
            return name
        return str(column.expression)

    def model_post_init(self, *args: Any, **kwargs: Any) -> None:
        object.__setattr__(self, "_initiated", True)

    def is_new(self) -> bool:
        """Checks if the object is new and has not been saved to the database."""
        if not isinstance(self, BaseSqlModel):
            return False
        return self.id == 0

    def get_uid(self) -> str:
        """Get the short code of the object's ID."""
        if not isinstance(self, BaseSqlModel):
            return ""
        if not isinstance(self.id, SnowflakeID) and isinstance(self.id, int):
            return SnowflakeID(self.id).to_short_code()
        return self.id.to_short_code()

    def has_changes(self) -> bool:
        """Check if the object has changes."""
        if not isinstance(self, BaseSqlModel) or not self.__changes:
            return False
        return bool(self.__changes)

    def clear_changes(self) -> None:
        """Clear the changes made to the object."""
        if not isinstance(self, BaseSqlModel) or not self.__changes:
            return
        self.__changes__.pop(self.__change_key)

    @model_serializer
    def serialize(self) -> dict[str, Any]:
        serialized = {}
        for key in self.model_fields:
            value = getattr(self, key)
            if isinstance(value, datetime):
                value = value.isoformat()
                if not value.count("+"):
                    value = f"{value}+00:00"
            elif isinstance(value, SecretStr):
                value = value.get_secret_value()
            serialized[key] = value
        return serialized

    @classmethod
    def api_schema(cls, schema: dict | None = None, **kwargs) -> dict[str, Any]:
        return {
            **ApiField.create_schema(cls, **kwargs),
            **(schema or {}),
        }

    def api_response(self, **kwargs) -> dict[str, Any]:
        return ApiField.convert(self, **kwargs)

    @abstractmethod
    def notification_data(self) -> dict[str, Any]: ...

    @overload
    @classmethod
    def get_foreign_models(cls) -> dict[str, type[SQLModel]]: ...
    @overload
    @classmethod
    def get_foreign_models(cls, opposite: Literal[False]) -> dict[str, type[SQLModel]]: ...
    @overload
    @classmethod
    def get_foreign_models(cls, opposite: Literal[True]) -> dict[type[SQLModel], set[str]]: ...
    @classmethod
    def get_foreign_models(cls, opposite: bool = False) -> dict[str, type[SQLModel]] | dict[type[SQLModel], set[str]]:
        foreign_models = {}
        for field_name, field in cls.model_fields.items():
            if not isinstance(field.json_schema_extra, dict) or "foreign_table" not in field.json_schema_extra:
                continue

            foreign_table = field.json_schema_extra["foreign_table"]
            if not isinstance(foreign_table, type) or not issubclass(foreign_table, SQLModel):
                continue

            if opposite:
                if foreign_table not in foreign_models:
                    foreign_models[foreign_table] = set()
                foreign_models[foreign_table].add(field_name)
            else:
                foreign_models[field_name] = foreign_table

        return foreign_models

    @abstractmethod
    def _get_repr_keys(self) -> list[str | tuple[str, str]]: ...

    def _repr(self, representable_keys: list[str | tuple[str, str]]) -> str:
        chunks = []
        if not self.is_new():
            chunks.append(f"id={self.id}")

        for representable in representable_keys:
            if isinstance(representable, tuple):
                key, repr_key = representable
            else:
                key = repr_key = representable

            if key == "id":
                continue

            value = getattr(self, key)
            if value is not None:
                chunks.append(f"{repr_key}={value}")

        if hasattr(self, "deleted_at") and getattr(self, "deleted_at") is not None:
            chunks.append(f"deleted_at={getattr(self, 'deleted_at')}")

        info = ", ".join(chunks)
        return f"{self.__class__.__name__}({info})"


class SoftDeleteModel(BaseSqlModel):
    """Base model for soft-deleting objects in the database inherited from :class:`BaseSqlModel`."""

    deleted_at: SafeDateTime | None = DateTimeField(default=None, nullable=True)


class EditorContentModel(BaseModel):
    content: str = Field(default="", description="The content of the editor in markdown format.")

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {"content": "string"}


class ChatContentModel(BaseModel):
    content: str = Field(default="")

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {"content": "string"}
