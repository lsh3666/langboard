from .bases import BaseBotDefaultScope
from .ProjectBotScope import ProjectBotScope


class ProjectBotDefaultScope(BaseBotDefaultScope, table=True):
    @staticmethod
    def get_available_conditions():
        return ProjectBotScope.get_available_conditions()
