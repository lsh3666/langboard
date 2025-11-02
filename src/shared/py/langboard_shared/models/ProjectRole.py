from enum import Enum
from ..core.db import SnowflakeIDField
from ..core.types import SnowflakeID
from .bases import BaseRoleModel
from .Project import Project


class ProjectRoleAction(Enum):
    Read = "read"  # included card_read
    Update = "update"
    CardWrite = "card_write"
    CardUpdate = "card_update"
    CardDelete = "card_delete"


class ProjectRole(BaseRoleModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project, nullable=False, index=True)

    @staticmethod
    def get_all_actions() -> list[Enum]:
        return list(ProjectRoleAction._member_map_.values())

    @staticmethod
    def get_default_actions() -> list[Enum]:
        return [ProjectRoleAction.Read]
