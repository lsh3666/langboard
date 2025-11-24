from enum import Enum
from typing import Any
from ...core.db import ApiField, Field, SnowflakeIDField, SoftDeleteModel
from ...core.types import SnowflakeID
from .Card import Card
from .Checklist import Checklist
from .User import User


class CheckitemStatus(Enum):
    Started = "started"
    Paused = "paused"
    Stopped = "stopped"


class Checkitem(SoftDeleteModel, table=True):
    checklist_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Checklist, nullable=False, index=True, api_field=ApiField(name="checklist_uid")
    )
    cardified_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Card, nullable=True)
    user_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User, nullable=True, index=True)
    title: str = Field(nullable=False, api_field=ApiField())
    status: CheckitemStatus = Field(default=CheckitemStatus.Stopped, nullable=False, api_field=ApiField())
    order: int = Field(default=0, nullable=False, api_field=ApiField())
    accumulated_seconds: int = Field(default=0, nullable=False, api_field=ApiField())
    is_checked: bool = Field(default=False, nullable=False, api_field=ApiField())

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return [
            "checklist_id",
            "cardified_id",
            "user_id",
            "title",
            "status",
            "order",
            "accumulated_seconds",
            "is_checked",
        ]
