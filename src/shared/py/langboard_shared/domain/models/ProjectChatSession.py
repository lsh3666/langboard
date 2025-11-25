from ...core.db import ApiField, SnowflakeIDField
from ...core.types import SnowflakeID
from .bases import BaseChatSessionModel
from .Project import Project


class ProjectChatSession(BaseChatSessionModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(
        foreign_key=Project, nullable=False, index=True, api_field=ApiField(name="filterable_uid")
    )
