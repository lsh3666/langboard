from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TBaseParam
from ....domain.models import ChatTemplate
from ....helpers import InfraHelper


class ChatTemplateRepository(BaseRepository[ChatTemplate]):
    @staticmethod
    def model_cls():
        return ChatTemplate

    @staticmethod
    def name() -> str:
        return "chat_template"

    def get_all_by_filterable(self, filterable_table: str, filterable_id: TBaseParam):
        filterable_id = InfraHelper.convert_id(filterable_id)
        query = SqlBuilder.select.table(ChatTemplate).where(
            (ChatTemplate.filterable_table == filterable_table) & (ChatTemplate.filterable_id == filterable_id)
        )

        templates = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            templates = result.all()

        return templates
