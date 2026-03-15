from ....core.domain import BaseRepository
from ....domain.models import CardBotScope


class CardBotScopeRepository(BaseRepository[CardBotScope]):
    @staticmethod
    def model_cls():
        return CardBotScope

    @staticmethod
    def name() -> str:
        return "card_bot_scope"
