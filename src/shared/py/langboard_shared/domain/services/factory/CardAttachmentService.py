from typing import Any
from ....core.domain import BaseDomainService
from ....core.storage import FileModel
from ....core.types.ParamTypes import TAttachmentParam, TCardParam, TProjectParam
from ....domain.models import Card, CardAttachment, Project, User
from ....helpers import InfraHelper
from ....publishers import CardAttachmentPublisher
from ....tasks.activities import CardAttachmentActivityTask
from ....tasks.bots import CardAttachmentBotTask


class CardAttachmentService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card_attachment"

    async def get_by_id_like(self, attachment: TAttachmentParam | None) -> CardAttachment | None:
        attachment = InfraHelper.get_by_id_like(CardAttachment, attachment)
        return attachment

    async def get_api_list_by_card(self, card: TCardParam | None) -> list[dict[str, Any]]:
        card = InfraHelper.get_by_id_like(Card, card)
        if not card:
            return []
        card_attachments = self.repo.card_attachment.get_list_by_card(card)
        return [
            {**card_attachment.api_response(), "user": user.api_response()}
            for card_attachment, user in card_attachments
        ]

    async def create(
        self, user: User, project: TProjectParam | None, card: TCardParam | None, attachment: FileModel
    ) -> CardAttachment | None:
        params = InfraHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        card_attachment = CardAttachment(
            user_id=user.id,
            card_id=card.id,
            filename=attachment.original_filename,
            file=attachment,
            order=self.repo.card_attachment.get_next_order(card),
        )

        self.repo.card_attachment.insert(card_attachment)

        await CardAttachmentPublisher.uploaded(user, card, card_attachment)
        CardAttachmentActivityTask.card_attachment_uploaded(user, project, card, card_attachment)
        CardAttachmentBotTask.card_attachment_uploaded(user, project, card, card_attachment)

        return card_attachment

    async def change_order(
        self,
        project: TProjectParam | None,
        card: TCardParam | None,
        card_attachment: TAttachmentParam | None,
        order: int,
    ) -> bool | None:
        params = InfraHelper.get_records_with_foreign_by_params(
            (Project, project), (Card, card), (CardAttachment, card_attachment)
        )
        if not params:
            return None
        project, card, card_attachment = params

        old_order = card_attachment.order
        card_attachment.order = order
        self.repo.card_attachment.update_column_order(card_attachment, card, old_order, order)

        await CardAttachmentPublisher.order_changed(card, card_attachment)

        return True

    async def change_name(
        self,
        user: User,
        project: TProjectParam | None,
        card: TCardParam | None,
        card_attachment: TAttachmentParam | None,
        name: str,
    ) -> bool | None:
        params = InfraHelper.get_records_with_foreign_by_params(
            (Project, project), (Card, card), (CardAttachment, card_attachment)
        )
        if not params:
            return None
        project, card, card_attachment = params

        old_name = card_attachment.filename
        card_attachment.filename = name

        self.repo.card_attachment.update(card_attachment)

        await CardAttachmentPublisher.name_changed(card, card_attachment)
        CardAttachmentActivityTask.card_attachment_name_changed(user, project, card, old_name, card_attachment)
        CardAttachmentBotTask.card_attachment_name_changed(user, project, card, card_attachment)

        return True

    async def delete(
        self,
        user: User,
        project: TProjectParam | None,
        card: TCardParam | None,
        card_attachment: TAttachmentParam | None,
    ) -> bool | None:
        params = InfraHelper.get_records_with_foreign_by_params(
            (Project, project), (Card, card), (CardAttachment, card_attachment)
        )
        if not params:
            return None
        project, card, card_attachment = params

        self.repo.card_attachment.delete(card_attachment)
        self.repo.card_attachment.reoder_after_delete(card, card_attachment.order)

        await CardAttachmentPublisher.deleted(card, card_attachment)
        CardAttachmentActivityTask.card_attachment_deleted(user, project, card, card_attachment)
        CardAttachmentBotTask.card_attachment_deleted(user, project, card, card_attachment)

        return True
