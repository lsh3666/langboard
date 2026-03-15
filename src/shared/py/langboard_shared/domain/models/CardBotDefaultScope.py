from .bases import BaseBotDefaultScope
from .CardBotScope import CardBotScope


class CardBotDefaultScope(BaseBotDefaultScope, table=True):
    @staticmethod
    def get_available_conditions():
        return CardBotScope.get_available_conditions()
