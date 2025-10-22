from typing import Any
from core.db import ApiField, Field, SnowflakeIDField, SoftDeleteModel
from core.types import SnowflakeID
from sqlalchemy import TEXT
from .User import User


class Project(SoftDeleteModel, table=True):
    owner_id: SnowflakeID = SnowflakeIDField(
        foreign_key=User, nullable=False, index=True, api_field=ApiField(name="owner_uid")
    )
    title: str = Field(nullable=False, api_field=ApiField())
    description: str | None = Field(default=None, sa_type=TEXT, api_field=ApiField())
    ai_description: str | None = Field(default=None, sa_type=TEXT, api_field=ApiField())
    project_type: str = Field(default="Other", nullable=False, api_field=ApiField())

    def notification_data(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "title": self.title,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["owner_id", "title", "project_type"]
