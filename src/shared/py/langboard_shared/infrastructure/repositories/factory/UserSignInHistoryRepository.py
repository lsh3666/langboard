from ....core.domain import BaseRepository
from ....domain.models import UserSignInHistory


class UserSignInHistoryRepository(BaseRepository[UserSignInHistory]):
    @staticmethod
    def model_cls():
        return UserSignInHistory

    @staticmethod
    def name() -> str:
        return "user_sign_in_history"
