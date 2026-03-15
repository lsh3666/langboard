from ....core.domain import BaseRepository
from ....domain.models import ProjectBotDefaultScope


class ProjectBotDefaultScopeRepository(BaseRepository[ProjectBotDefaultScope]):
    @staticmethod
    def model_cls():
        return ProjectBotDefaultScope

    @staticmethod
    def name() -> str:
        return "project_bot_default_scope"
