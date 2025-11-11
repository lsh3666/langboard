from ..core.db import ApiField, SnowflakeIDField
from ..core.types import SnowflakeID
from .bases import BaseBotLogModel
from .Card import Card


class CardBotLog(BaseBotLogModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Card, nullable=False, index=True, api_field=ApiField(name="filterable_uid")
    )
