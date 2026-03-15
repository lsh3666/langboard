from ....core.domain import BaseRepository
from ....domain.models import CardBotDefaultScope


class CardBotDefaultScopeRepository(BaseRepository[CardBotDefaultScope]):
    @staticmethod
    def model_cls():
        return CardBotDefaultScope

    @staticmethod
    def name() -> str:
        return "card_bot_default_scope"
