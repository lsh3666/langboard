from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TUserParam
from ....domain.models import UserEmail
from ....helpers import InfraHelper


class UserEmailRepository(BaseRepository[UserEmail]):
    @staticmethod
    def model_cls():
        return UserEmail

    @staticmethod
    def name() -> str:
        return "user_email"

    def get_all_by_user(self, user: TUserParam):
        user_id = InfraHelper.convert_id(user)
        emails = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(SqlBuilder.select.table(UserEmail).where(UserEmail.column("user_id") == user_id))
            emails = result.all()
        return emails
