from ...core.db import ApiField, SnowflakeIDField
from ...core.types import SnowflakeID
from .bases import BaseBotScheduleModel
from .Project import Project


class ProjectBotSchedule(BaseBotScheduleModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Project, nullable=False, index=True, api_field=ApiField(name="project_uid")
    )

    @staticmethod
    def get_scope_column_name() -> str:
        return "project_id"
