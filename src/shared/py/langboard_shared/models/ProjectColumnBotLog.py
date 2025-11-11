from ..core.db import ApiField, SnowflakeIDField
from ..core.types import SnowflakeID
from .bases import BaseBotLogModel
from .ProjectColumn import ProjectColumn


class ProjectColumnBotLog(BaseBotLogModel, table=True):
    project_column_id: SnowflakeID = SnowflakeIDField(
        foreign_key=ProjectColumn, nullable=False, index=True, api_field=ApiField(name="filterable_uid")
    )
