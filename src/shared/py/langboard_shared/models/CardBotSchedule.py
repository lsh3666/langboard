from ..core.db import ApiField, SnowflakeIDField
from ..core.types import SnowflakeID
from .bases import BaseBotScheduleModel
from .Card import Card


class CardBotSchedule(BaseBotScheduleModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Card, nullable=False, index=True, api_field=ApiField(name="card_uid")
    )

    @staticmethod
    def get_scope_column_name() -> str:
        return "card_id"
