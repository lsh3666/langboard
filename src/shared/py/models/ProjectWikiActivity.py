from enum import Enum
from typing import Any
from core.db import ApiField, EnumLikeType, Field, SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseActivityModel
from .Project import Project
from .ProjectWiki import ProjectWiki


class ProjectWikiActivityType(Enum):
    WikiCreated = "wiki_created"
    WikiUpdated = "wiki_updated"
    WikiPublicityChanged = "wiki_publicity_changed"
    WikiAssigneesUpdated = "wiki_assignees_updated"
    WikiDeleted = "wiki_deleted"


class ProjectWikiActivity(BaseActivityModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project, index=True)
    project_wiki_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectWiki, index=True)
    activity_type: ProjectWikiActivityType = Field(
        nullable=False, sa_type=EnumLikeType(ProjectWikiActivityType), api_field=ApiField()
    )

    def api_response(self) -> dict[str, Any]:
        response = super().api_response()
        response["filterable_map"] = {
            Project.__tablename__: self.project_id.to_short_code(),
            ProjectWiki.__tablename__: self.project_wiki_id.to_short_code(),
        }
        return response
