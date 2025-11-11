from typing import Any
from ..core.db import ApiField, ChatContentModel, Field, ModelColumnType, SnowflakeIDField, SoftDeleteModel
from ..core.types import SnowflakeID
from .ChatSession import ChatSession


class ChatHistory(SoftDeleteModel, table=True):
    chat_session_id: SnowflakeID = SnowflakeIDField(
        foreign_key=ChatSession, index=True, api_field=ApiField(name="chat_session_uid")
    )
    message: ChatContentModel = Field(
        default=ChatContentModel(), sa_type=ModelColumnType(ChatContentModel), api_field=ApiField()
    )
    is_received: bool = Field(default=False, index=True, api_field=ApiField())

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["chat_session_id", "message", "is_received"]
