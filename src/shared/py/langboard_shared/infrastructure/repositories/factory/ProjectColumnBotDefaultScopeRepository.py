from ....core.domain import BaseRepository
from ....domain.models import ProjectColumnBotDefaultScope


class ProjectColumnBotDefaultScopeRepository(BaseRepository[ProjectColumnBotDefaultScope]):
    @staticmethod
    def model_cls():
        return ProjectColumnBotDefaultScope

    @staticmethod
    def name() -> str:
        return "project_column_bot_default_scope"
