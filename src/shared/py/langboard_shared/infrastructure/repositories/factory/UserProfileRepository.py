from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TUserParam
from ....domain.models import UserProfile
from ....helpers import InfraHelper


class UserProfileRepository(BaseRepository[UserProfile]):
    @staticmethod
    def model_cls():
        return UserProfile

    @staticmethod
    def name() -> str:
        return "user_profile"

    def get_by_user(self, user: TUserParam):
        user_id = InfraHelper.convert_id(user)
        profile = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(UserProfile).where(UserProfile.column("user_id") == user_id).limit(1)
            )
            profile = result.first()
        return profile
