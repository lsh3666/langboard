from ....core.domain import BaseRepository
from ....domain.models import ProjectBotScope


class ProjectBotScopeRepository(BaseRepository[ProjectBotScope]):
    @staticmethod
    def model_cls():
        return ProjectBotScope

    @staticmethod
    def name() -> str:
        return "project_bot_scope"
