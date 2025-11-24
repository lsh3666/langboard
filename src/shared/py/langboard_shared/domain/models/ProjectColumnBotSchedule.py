from ...core.db import ApiField, SnowflakeIDField
from ...core.types import SnowflakeID
from .bases import BaseBotScheduleModel
from .ProjectColumn import ProjectColumn


class ProjectColumnBotSchedule(BaseBotScheduleModel, table=True):
    project_column_id: SnowflakeID = SnowflakeIDField(
        foreign_key=ProjectColumn, nullable=False, index=True, api_field=ApiField(name="project_column_uid")
    )

    @staticmethod
    def get_scope_column_name() -> str:
        return "project_column_id"
