from .bases import BaseBotDefaultScope
from .ProjectColumnBotScope import ProjectColumnBotScope


class ProjectColumnBotDefaultScope(BaseBotDefaultScope, table=True):
    @staticmethod
    def get_available_conditions():
        return ProjectColumnBotScope.get_available_conditions()
