from typing import Any
from ..core.db import ApiField, SnowflakeIDField
from ..core.types import SnowflakeID
from .bases import BaseMetadataModel
from .Card import Card


class CardMetadata(BaseMetadataModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Card, nullable=False, index=True, api_field=ApiField(name="card_uid")
    )

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_id", "key"]
