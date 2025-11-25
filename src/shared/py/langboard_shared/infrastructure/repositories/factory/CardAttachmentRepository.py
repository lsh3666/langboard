from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseOrderRepository
from ....core.types.ParamTypes import TCardParam
from ....domain.models import Card, CardAttachment, User
from ....helpers import InfraHelper


class CardAttachmentRepository(BaseOrderRepository[CardAttachment, Card]):
    @staticmethod
    def parent_model_cls():
        return Card

    @staticmethod
    def model_cls():
        return CardAttachment

    @staticmethod
    def name() -> str:
        return "card_attachment"

    def get_list_by_card(self, card: TCardParam):
        card_id = InfraHelper.convert_id(card)
        card_attachments = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(CardAttachment, User)
                .join(User, CardAttachment.column("user_id") == User.column("id"))
                .where(CardAttachment.column("card_id") == card_id)
                .order_by(
                    CardAttachment.column("order").asc(),
                    CardAttachment.column("id").desc(),
                )
                .group_by(
                    CardAttachment.column("id"),
                    CardAttachment.column("order"),
                    User.column("id"),
                )
            )
            card_attachments = result.all()

        return card_attachments
