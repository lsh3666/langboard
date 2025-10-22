from typing import Any
from core.db import ApiField, BaseSqlModel, DateTimeField, Field, SnowflakeIDField
from core.types import SafeDateTime, SnowflakeID
from .User import User


class ChatSession(BaseSqlModel, table=True):
    filterable_table: str = Field(..., api_field=ApiField())
    filterable_id: SnowflakeID = SnowflakeIDField(api_field=ApiField(name="filterable_uid"))
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, index=True, api_field=ApiField(name="user_uid"))
    title: str = Field(default="", nullable=False, api_field=ApiField())
    last_messaged_at: SafeDateTime | None = DateTimeField(default=None, nullable=True, api_field=ApiField())

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["filterable_table", "filterable_id", "user_id", "title", "last_messaged_at"]
