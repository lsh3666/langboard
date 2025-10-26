from abc import abstractmethod
from typing import Any
from core.db import BaseSqlModel, SnowflakeIDField
from core.types import SnowflakeID
from ..BotSchedule import BotSchedule


class BaseBotScheduleModel(BaseSqlModel):
    bot_schedule_id: SnowflakeID = SnowflakeIDField(foreign_key=BotSchedule, nullable=False, index=True)

    @staticmethod
    @abstractmethod
    def get_scope_column_name() -> str: ...

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        keys: list[str | tuple[str, str]] = ["bot_schedule_id"]
        keys.extend([field for field in self.model_fields if field not in BaseBotScheduleModel.model_fields])
        return keys
