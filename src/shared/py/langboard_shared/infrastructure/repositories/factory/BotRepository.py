from ....core.domain import BaseRepository
from ....domain.models import Bot


class BotRepository(BaseRepository[Bot]):
    @staticmethod
    def model_cls():
        return Bot

    @staticmethod
    def name() -> str:
        return "bot"
