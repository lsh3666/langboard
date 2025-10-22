from typing import Any
from core.db import BaseSqlModel, SnowflakeIDField
from core.types import SnowflakeID
from .Card import Card
from .ProjectLabel import ProjectLabel


class CardAssignedProjectLabel(BaseSqlModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card, nullable=False, index=True)
    project_label_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectLabel, nullable=False, index=True)

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_id", "project_label_id"]
