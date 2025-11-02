from typing import Any
from ...core.db import DbSession, SqlBuilder
from ...core.service import BaseService
from ...core.storage import FileModel
from ...helpers import ServiceHelper
from ...models import Card, CardAttachment, Project, User
from ...publishers import CardAttachmentPublisher
from ...tasks.activities import CardAttachmentActivityTask
from ...tasks.bots import CardAttachmentBotTask
from .Types import TAttachmentParam, TCardParam, TProjectParam


class CardAttachmentService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card_attachment"

    async def get_by_uid(self, uid: str) -> CardAttachment | None:
        return ServiceHelper.get_by_param(CardAttachment, uid)

    async def get_board_list(self, card: TCardParam) -> list[dict[str, Any]]:
        card = ServiceHelper.get_by_param(Card, card)
        if not card:
            return []
        card_attachments = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(CardAttachment, User)
                .join(User, CardAttachment.column("user_id") == User.column("id"))
                .where(CardAttachment.column("card_id") == card.id)
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

        return [
            {**card_attachment.api_response(), "user": user.api_response()}
            for card_attachment, user in card_attachments
        ]

    async def create(
        self,
        user: User,
        project: TProjectParam,
        card: TCardParam,
        attachment: FileModel,
    ) -> CardAttachment | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        max_order = ServiceHelper.get_max_order(CardAttachment, "card_id", card.id)

        card_attachment = CardAttachment(
            user_id=user.id,
            card_id=card.id,
            filename=attachment.original_filename,
            file=attachment,
            order=max_order,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(card_attachment)

        await CardAttachmentPublisher.uploaded(user, card, card_attachment)
        CardAttachmentActivityTask.card_attachment_uploaded(user, project, card, card_attachment)
        CardAttachmentBotTask.card_attachment_uploaded(user, project, card, card_attachment)

        return card_attachment

    async def change_order(
        self,
        project: TProjectParam,
        card: TCardParam,
        card_attachment: TAttachmentParam,
        order: int,
    ) -> bool | None:
        params = ServiceHelper.get_records_with_foreign_by_params(
            (Project, project), (Card, card), (CardAttachment, card_attachment)
        )
        if not params:
            return None
        project, card, card_attachment = params

        original_order = card_attachment.order
        update_query = SqlBuilder.update.table(CardAttachment).where(CardAttachment.column("card_id") == card.id)
        update_query = ServiceHelper.set_order_in_column(update_query, CardAttachment, original_order, order)
        with DbSession.use(readonly=False) as db:
            # Lock
            db.exec(
                SqlBuilder.select.table(CardAttachment)
                .where(CardAttachment.column("card_id") == card.id)
                .with_for_update()
            ).all()

            db.exec(update_query)
            card_attachment.order = order
            db.update(card_attachment)

        await CardAttachmentPublisher.order_changed(card, card_attachment)

        return True

    async def change_name(
        self,
        user: User,
        project: TProjectParam,
        card: TCardParam,
        card_attachment: TAttachmentParam,
        name: str,
    ) -> bool | None:
        params = ServiceHelper.get_records_with_foreign_by_params(
            (Project, project), (Card, card), (CardAttachment, card_attachment)
        )
        if not params:
            return None
        project, card, card_attachment = params

        old_name = card_attachment.filename
        card_attachment.filename = name

        with DbSession.use(readonly=False) as db:
            db.update(card_attachment)

        await CardAttachmentPublisher.name_changed(card, card_attachment)
        CardAttachmentActivityTask.card_attachment_name_changed(user, project, card, old_name, card_attachment)
        CardAttachmentBotTask.card_attachment_name_changed(user, project, card, card_attachment)

        return True

    async def delete(
        self,
        user: User,
        project: TProjectParam,
        card: TCardParam,
        card_attachment: TAttachmentParam,
    ) -> bool | None:
        params = ServiceHelper.get_records_with_foreign_by_params(
            (Project, project), (Card, card), (CardAttachment, card_attachment)
        )
        if not params:
            return None
        project, card, card_attachment = params

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(CardAttachment)
                .values({CardAttachment.order: CardAttachment.order - 1})
                .where(
                    (CardAttachment.column("order") > card_attachment.order)
                    & (CardAttachment.column("card_id") == card.id)
                )
            )

        with DbSession.use(readonly=False) as db:
            db.delete(card_attachment)

        await CardAttachmentPublisher.deleted(card, card_attachment)
        CardAttachmentActivityTask.card_attachment_deleted(user, project, card, card_attachment)
        CardAttachmentBotTask.card_attachment_deleted(user, project, card, card_attachment)

        return True
