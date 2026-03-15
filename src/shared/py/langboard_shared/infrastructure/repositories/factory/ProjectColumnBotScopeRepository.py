from ....core.domain import BaseRepository
from ....domain.models import ProjectColumnBotScope


class ProjectColumnBotScopeRepository(BaseRepository[ProjectColumnBotScope]):
    @staticmethod
    def model_cls():
        return ProjectColumnBotScope

    @staticmethod
    def name() -> str:
        return "project_column_bot_scope"
