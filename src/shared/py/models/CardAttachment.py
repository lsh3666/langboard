from typing import Any
from core.db import ApiField, Field, ModelColumnType, SnowflakeIDField, SoftDeleteModel
from core.storage import FileModel
from core.types import SnowflakeID
from .Card import Card
from .User import User


class CardAttachment(SoftDeleteModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)
    card_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Card, nullable=False, index=True, api_field=ApiField(name="card_uid")
    )
    filename: str = Field(nullable=False, api_field=ApiField(name="name"))
    file: FileModel = Field(sa_type=ModelColumnType(FileModel), api_field=ApiField(name="url", field_base_model="path"))
    order: int = Field(default=0, api_field=ApiField())

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "card_id", "filename", "file"]
