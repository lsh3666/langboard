from typing import Any
from core.db import BaseSqlModel, Field, SnowflakeIDField
from core.types import SnowflakeID
from .UserGroup import UserGroup


class UserGroupAssignedEmail(BaseSqlModel, table=True):
    group_id: SnowflakeID = SnowflakeIDField(foreign_key=UserGroup, nullable=False, index=True)
    email: str = Field(nullable=False)

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["group_id", "email"]
