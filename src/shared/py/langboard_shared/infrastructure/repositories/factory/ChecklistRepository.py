from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseOrderRepository
from ....core.types.ParamTypes import TCardParam, TProjectParam
from ....domain.models import Card, Checklist
from ....helpers import InfraHelper


class ChecklistRepository(BaseOrderRepository[Checklist, Card]):
    @staticmethod
    def parent_model_cls():
        return Card

    @staticmethod
    def model_cls():
        return Checklist

    @staticmethod
    def name() -> str:
        return "checklist"

    def get_all_by_card(self, card: TCardParam) -> list[Checklist]:
        card_id = InfraHelper.convert_id(card)

        checklists = InfraHelper.get_all_by(Checklist, "card_id", card_id)
        return checklists

    def get_all_by_project(self, project: TProjectParam) -> list[Checklist]:
        project_id = InfraHelper.convert_id(project)

        checklists = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(Checklist)
                .join(Card, Checklist.column("card_id") == Card.column("id"))
                .where(Card.column("project_id") == project_id)
            )
            checklists = result.all()

        return checklists
