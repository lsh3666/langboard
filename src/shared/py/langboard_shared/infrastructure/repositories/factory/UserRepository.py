from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types import SafeDateTime
from ....domain.models import User, UserEmail, UserProfile
from ....helpers import InfraHelper


class UserRepository(BaseRepository[User]):
    @staticmethod
    def model_cls():
        return User

    @staticmethod
    def name() -> str:
        return "user"

    def count_users_scroller(self, refer_time: SafeDateTime) -> int:
        outdated_query = SqlBuilder.select.count(User, User.column("id")).where(
            (User.column("created_at") > refer_time) & (User.column("deleted_at") == None)  # noqa
        )

        count = 0
        with DbSession.use(readonly=True) as db:
            count = db.exec(outdated_query).first() or 0
        return count

    def get_all_with_profile_scroller(self, refer_time: SafeDateTime):
        query = (
            SqlBuilder.select.tables(User, UserProfile)
            .join(UserProfile, User.column("id") == UserProfile.column("user_id"))
            .where(User.column("created_at") <= refer_time)
            .order_by(User.column("created_at").desc(), User.column("id").desc())
        )

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            records = result.all()
        return records

    def get_by_email(self, email: str | None):
        user = InfraHelper.get_by(User, "email", email)
        if user:
            return user, None
        record = (None, None)
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(User, UserEmail)
                .join(
                    UserEmail,
                    (User.column("id") == UserEmail.column("user_id")) & (UserEmail.column("deleted_at") == None),  # noqa
                )
                .where(UserEmail.column("email") == email)
                .limit(1)
            )
            record = result.first() or (None, None)
        return record
