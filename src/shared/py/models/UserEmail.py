from typing import Any
from core.db import ApiField, DateTimeField, Field, SnowflakeIDField, SoftDeleteModel
from core.types import SafeDateTime, SnowflakeID
from .User import User


class UserEmail(SoftDeleteModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)
    email: str = Field(nullable=False, api_field=ApiField())
    verified_at: SafeDateTime | None = DateTimeField(default=None, nullable=True, api_field=ApiField())

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "email", "verified_at"]
