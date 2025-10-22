from typing import Any
from core.db import ApiField, BaseSqlModel, Field
from sqlalchemy import TEXT


class BaseMetadataModel(BaseSqlModel):
    key: str = Field(nullable=False, index=True, api_field=ApiField())
    value: str = Field(default="", nullable=False, sa_type=TEXT, api_field=ApiField())

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
