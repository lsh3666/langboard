from typing import Any, Literal
from ...core.db import BaseSqlModel, DbSession, SqlBuilder
from ...core.schema import Pagination
from ...core.service import BaseService
from ...core.types import SafeDateTime, SnowflakeID
from ...helpers import ServiceHelper
from ...models import ChatHistory, ChatSession, ChatTemplate, User
from .Types import TChatHistoryParam, TChatSessionParam, TChatTemplateParam


class ChatService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "chat"

    async def get_session_by_uid(self, uid: str) -> ChatSession | None:
        return ServiceHelper.get_by_param(ChatSession, uid)

    async def get_session_list(
        self,
        user: User,
        filterable_table: str,
        filterable_id: SnowflakeID | str,
    ) -> list[dict[str, Any]]:
        filterable_id = ServiceHelper.convert_id(filterable_id)
        sql_query = (
            SqlBuilder.select.table(ChatSession)
            .where(
                (ChatSession.user_id == user.id)
                & (ChatSession.filterable_table == filterable_table)
                & (ChatSession.filterable_id == filterable_id)
            )
            .order_by(ChatSession.column("last_messaged_at").desc(), ChatSession.column("id").desc())
            .group_by(ChatSession.column("id"), ChatSession.column("last_messaged_at"))
        )

        sessions = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(sql_query)
            sessions = result.all()

        chat_sessions = []
        for chat_session in sessions:
            chat_sessions.append(chat_session.api_response())

        return chat_sessions

    async def get_history_list(
        self,
        user: User,
        session: TChatSessionParam,
        refer_time: SafeDateTime,
        pagination: Pagination,
    ) -> list[dict[str, Any]]:
        session = ServiceHelper.get_by_param(ChatSession, session)
        if not session or session.user_id != user.id:
            return []

        sql_query = SqlBuilder.select.table(ChatHistory).where(
            (ChatHistory.chat_session_id == session.id) & (ChatHistory.created_at <= refer_time)
        )
        sql_query = ServiceHelper.paginate(sql_query, pagination.page, pagination.limit)
        sql_query = sql_query.order_by(ChatHistory.column("created_at").desc(), ChatHistory.column("id").desc())
        sql_query = sql_query.group_by(ChatHistory.column("id"), ChatHistory.column("created_at"))

        histories = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(sql_query)
            histories = result.all()

        chat_histories = []
        for chat_history in histories:
            chat_histories.append(chat_history.api_response())

        return chat_histories

    async def update_session(self, session: TChatSessionParam, title: str):
        session = ServiceHelper.get_by_param(ChatSession, session)
        if not session:
            return None

        session.title = title

        with DbSession.use(readonly=False) as db:
            db.update(session)

        return session

    async def delete_session(self, session: TChatSessionParam):
        session = ServiceHelper.get_by_param(ChatSession, session)
        if not session:
            return None

        with DbSession.use(readonly=False) as db:
            db.delete(session)

    async def delete_history(self, chat_history: TChatHistoryParam):
        chat_history = ServiceHelper.get_by_param(ChatHistory, chat_history)
        if not chat_history:
            return None

        with DbSession.use(readonly=False) as db:
            db.delete(chat_history)

    async def get_templates(self, filterable_table: str, filterable_id: int | str) -> list[dict[str, Any]]:
        filterable_id = ServiceHelper.convert_id(filterable_id)
        sql_query = SqlBuilder.select.table(ChatTemplate).where(
            (ChatTemplate.filterable_table == filterable_table) & (ChatTemplate.filterable_id == filterable_id)
        )

        with DbSession.use(readonly=True) as db:
            result = db.exec(sql_query)
            templates = result.all()

        return [template.api_response() for template in templates]

    async def create_template(self, filterable: BaseSqlModel, name: str, template: str) -> ChatTemplate:
        chat_template = ChatTemplate(
            filterable_table=filterable.__tablename__,
            filterable_id=filterable.id,
            name=name,
            template=template,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(chat_template)

        return chat_template

    async def update_template(
        self, chat_template: TChatTemplateParam, name: str | None, template: str | None
    ) -> tuple[ChatTemplate, dict[str, Any]] | None | Literal[True]:
        chat_template = ServiceHelper.get_by_param(ChatTemplate, chat_template)
        if not chat_template:
            return None

        model = {}
        if name:
            chat_template.name = name
            model["name"] = name

        if template:
            chat_template.template = template
            model["template"] = template

        if not model:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(chat_template)

        return chat_template, model

    async def delete_template(self, chat_template: TChatTemplateParam) -> bool:
        chat_template = ServiceHelper.get_by_param(ChatTemplate, chat_template)
        if not chat_template:
            return False

        with DbSession.use(readonly=False) as db:
            db.delete(chat_template)
        return True
