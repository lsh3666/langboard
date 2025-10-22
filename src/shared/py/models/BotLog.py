from enum import Enum
from typing import Any
from core.db import ApiField, BaseSqlModel, EnumLikeType, Field, ModelColumnListType, SnowflakeIDField
from core.types import SafeDateTime, SnowflakeID
from pydantic import BaseModel
from .Bot import Bot


class BotLogType(Enum):
    Info = "info"
    Success = "success"
    Error = "error"


class BotLogMessage(BaseModel):
    message: str
    log_type: BotLogType
    log_date: SafeDateTime = Field(default_factory=SafeDateTime.now, nullable=False)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {"message": "string", "log_type": "string", "log_date": "string"}


class BotLog(BaseSqlModel, table=True):
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot, index=True, api_field=ApiField(name="bot_uid"))
    log_type: BotLogType = Field(
        default=BotLogType.Info, nullable=False, sa_type=EnumLikeType(BotLogType), api_field=ApiField()
    )
    message_stack: list[BotLogMessage] = Field(
        default=[], nullable=False, sa_type=ModelColumnListType(BotLogMessage), api_field=ApiField()
    )

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["bot_id", "log_type"]
