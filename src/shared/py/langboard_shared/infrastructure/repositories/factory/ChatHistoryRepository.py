from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.schema import TimeBasedPagination
from ....core.types.ParamTypes import TChatSessionParam, TUserParam
from ....domain.models import ChatHistory, ChatSession
from ....helpers import InfraHelper


class ChatHistoryRepository(BaseRepository[ChatHistory]):
    @staticmethod
    def model_cls():
        return ChatHistory

    @staticmethod
    def name() -> str:
        return "chat_history"

    def get_all_by_user_scroller(
        self, user: TUserParam, session: TChatSessionParam | None, pagination: TimeBasedPagination
    ):
        user_id = InfraHelper.convert_id(user)
        session = InfraHelper.get_by_id_like(ChatSession, session)
        if not session or session.user_id != user_id:
            return []

        query = SqlBuilder.select.table(ChatHistory).where(
            (ChatHistory.chat_session_id == session.id) & (ChatHistory.created_at <= pagination.refer_time)
        )
        query = InfraHelper.paginate(query, pagination.page, pagination.limit)
        query = query.order_by(ChatHistory.column("created_at").desc(), ChatHistory.column("id").desc())
        query = query.group_by(ChatHistory.column("id"), ChatHistory.column("created_at"))

        histories = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            histories = result.all()

        return histories
