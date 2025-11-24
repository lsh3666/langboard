from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TBaseParam, TUserParam
from ....domain.models import ChatSession
from ....helpers import InfraHelper


class ChatSessionRepository(BaseRepository[ChatSession]):
    @staticmethod
    def model_cls():
        return ChatSession

    @staticmethod
    def name() -> str:
        return "chat_session"

    def get_all_by_user_and_filterable(self, user: TUserParam, filterable_table: str, filterable_id: TBaseParam):
        user_id = InfraHelper.convert_id(user)
        filterable_id = InfraHelper.convert_id(filterable_id)
        query = (
            SqlBuilder.select.table(ChatSession)
            .where(
                (ChatSession.user_id == user_id)
                & (ChatSession.filterable_table == filterable_table)
                & (ChatSession.filterable_id == filterable_id)
            )
            .order_by(ChatSession.column("last_messaged_at").desc(), ChatSession.column("id").desc())
            .group_by(ChatSession.column("id"), ChatSession.column("last_messaged_at"))
        )

        sessions = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            sessions = result.all()

        return sessions
