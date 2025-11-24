from enum import Enum
from typing import Any
from ...core.db import ApiField, EnumLikeType, Field, SnowflakeIDField
from ...core.types import SnowflakeID
from .bases import BaseActivityModel
from .Bot import Bot
from .User import User


class UserActivityType(Enum):
    Activated = "activated"
    DeclinedProjectInvitation = "declined_project_invitation"


class UserActivity(BaseActivityModel, table=True):
    activity_type: UserActivityType | None = Field(
        default=None, nullable=True, sa_type=EnumLikeType(UserActivityType), api_field=ApiField()
    )
    refer_activity_table: str | None = Field(default=None, nullable=True)
    refer_activity_id: SnowflakeID | None = SnowflakeIDField(nullable=True)

    def api_response(self) -> dict[str, Any]:
        response = super().api_response()
        response["filterable_map"] = {}
        if self.user_id:
            response["filterable_map"][User.__tablename__] = self.user_id.to_short_code()
        elif self.bot_id:
            response["filterable_map"][Bot.__tablename__] = self.bot_id.to_short_code()
        return response
