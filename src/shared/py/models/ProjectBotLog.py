from core.db import ApiField, SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseBotLogModel
from .Project import Project


class ProjectBotLog(BaseBotLogModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Project, nullable=False, index=True, api_field=ApiField(name="filterable_uid")
    )
