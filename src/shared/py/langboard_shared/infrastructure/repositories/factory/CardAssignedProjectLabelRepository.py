from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TCardParam
from ....domain.models import CardAssignedProjectLabel
from ....helpers import InfraHelper


class CardAssignedProjectLabelRepository(BaseRepository[CardAssignedProjectLabel]):
    @staticmethod
    def model_cls():
        return CardAssignedProjectLabel

    @staticmethod
    def name() -> str:
        return "card_assigned_project_label"

    def delete_all_by_card(self, card: TCardParam):
        card_id = InfraHelper.convert_id(card)

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(CardAssignedProjectLabel).where(
                    CardAssignedProjectLabel.column("card_id") == card_id
                )
            )
