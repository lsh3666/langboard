from typing import Literal
from ...domain.models.Card import Card
from ...domain.models.Project import Project
from ...domain.models.ProjectColumn import ProjectColumn


TBotAvailableTargets = Project | ProjectColumn | Card
TBotAvailableTargetClass = type[Project] | type[ProjectColumn] | type[Card]
TBotTypeName = Literal["schedule", "scope", "log"]

AVAILABLE_BOT_TARGET_TABLES: dict[str, TBotAvailableTargetClass] = {
    Project.__tablename__: Project,
    ProjectColumn.__tablename__: ProjectColumn,
    Card.__tablename__: Card,
}

SUFFIXES: dict[TBotTypeName, str] = {
    "schedule": "bot_schedule",
    "scope": "bot_scope",
    "log": "bot_log",
}
