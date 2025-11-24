from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TUserGroupParam
from ....domain.models import User, UserEmail, UserGroupAssignedEmail
from ....helpers import InfraHelper


class UserGroupAssignedEmailRepository(BaseRepository[UserGroupAssignedEmail]):
    @staticmethod
    def model_cls():
        return UserGroupAssignedEmail

    @staticmethod
    def name() -> str:
        return "user_group_assigned_email"

    def get_users_by_group(self, user_group: TUserGroupParam) -> list[tuple[UserGroupAssignedEmail, User | None]]:
        user_group_id = InfraHelper.convert_id(user_group)

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(UserGroupAssignedEmail, User)
                .outerjoin(
                    UserEmail,
                    (UserEmail.column("email") == UserGroupAssignedEmail.column("email"))
                    & (UserEmail.column("deleted_at") == None),  # noqa
                )
                .outerjoin(
                    User,
                    (User.column("email") == UserGroupAssignedEmail.column("email"))
                    | (User.column("id") == UserEmail.column("user_id")),
                )
                .where(UserGroupAssignedEmail.column("group_id") == user_group_id)
                .order_by(
                    UserGroupAssignedEmail.column("email"),
                    UserGroupAssignedEmail.column("id"),
                )
                .group_by(
                    UserGroupAssignedEmail.column("email"),
                    UserGroupAssignedEmail.column("id"),
                    User.column("id"),
                )
            )
            records = result.all()
        return list(records)

    def delete_all_by_group(self, user_group: TUserGroupParam):
        user_group_id = InfraHelper.convert_id(user_group)

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(UserGroupAssignedEmail).where(
                    UserGroupAssignedEmail.column("group_id") == user_group_id
                )
            )
