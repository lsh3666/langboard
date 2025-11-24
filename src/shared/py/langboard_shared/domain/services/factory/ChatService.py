from typing import Any, Literal
from ....core.db import BaseSqlModel
from ....core.domain import BaseDomainService
from ....core.schema import TimeBasedPagination
from ....core.types import SnowflakeID
from ....core.types.ParamTypes import TChatHistoryParam, TChatSessionParam, TChatTemplateParam
from ....domain.models import ChatHistory, ChatSession, ChatTemplate, User
from ....helpers import InfraHelper


class ChatService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "chat"

    async def get_session_by_id_like(self, session: TChatSessionParam | None) -> ChatSession | None:
        session = InfraHelper.get_by_id_like(ChatSession, session)
        return session

    async def get_api_session_list(
        self, user: User, filterable_table: str, filterable_id: SnowflakeID | str
    ) -> list[dict[str, Any]]:
        sessions = self.repo.chat_session.get_all_by_user_and_filterable(user, filterable_table, filterable_id)

        chat_sessions = []
        for chat_session in sessions:
            chat_sessions.append(chat_session.api_response())

        return chat_sessions

    async def update_session(self, session: TChatSessionParam | None, title: str):
        session = InfraHelper.get_by_id_like(ChatSession, session)
        if not session:
            return None

        session.title = title

        self.repo.chat_session.update(session)

        return session

    async def delete_session(self, session: TChatSessionParam | None):
        session = InfraHelper.get_by_id_like(ChatSession, session)
        if not session:
            return None

        self.repo.chat_session.delete(session)

    async def get_history_by_id_like(self, chat_history: TChatHistoryParam | None) -> ChatHistory | None:
        chat_history = InfraHelper.get_by_id_like(ChatHistory, chat_history)
        return chat_history

    async def get_api_history_list(
        self, user: User, session: TChatSessionParam | None, pagination: TimeBasedPagination
    ) -> list[dict[str, Any]]:
        session = InfraHelper.get_by_id_like(ChatSession, session)
        if not session or session.user_id != user.id:
            return []

        histories = self.repo.chat_history.get_all_by_user_scroller(user, session, pagination)

        chat_histories = []
        for chat_history in histories:
            chat_histories.append(chat_history.api_response())

        return chat_histories

    async def delete_history(self, chat_history: TChatHistoryParam | None):
        chat_history = InfraHelper.get_by_id_like(ChatHistory, chat_history)
        if not chat_history:
            return None

        self.repo.chat_history.delete(chat_history)

    async def get_template_by_id_like(self, chat_template: TChatTemplateParam | None) -> ChatTemplate | None:
        chat_template = InfraHelper.get_by_id_like(ChatTemplate, chat_template)
        return chat_template

    async def get_api_template_list(self, filterable_table: str, filterable_id: int | str) -> list[dict[str, Any]]:
        templates = self.repo.chat_template.get_all_by_filterable(filterable_table, filterable_id)

        return [template.api_response() for template in templates]

    async def create_template(self, filterable: BaseSqlModel, name: str, template: str) -> ChatTemplate:
        chat_template = ChatTemplate(
            filterable_table=filterable.__tablename__,
            filterable_id=filterable.id,
            name=name,
            template=template,
        )

        self.repo.chat_template.insert(chat_template)

        return chat_template

    async def update_template(
        self, chat_template: TChatTemplateParam | None, name: str | None, template: str | None
    ) -> tuple[ChatTemplate, dict[str, Any]] | None | Literal[True]:
        chat_template = InfraHelper.get_by_id_like(ChatTemplate, chat_template)
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

        self.repo.chat_template.update(chat_template)

        return chat_template, model

    async def delete_template(self, chat_template: TChatTemplateParam | None) -> bool:
        chat_template = InfraHelper.get_by_id_like(ChatTemplate, chat_template)
        if not chat_template:
            return False

        self.repo.chat_template.delete(chat_template)
        return True
