from typing import Any
from core.db import DbSession, EditorContentModel, SqlBuilder
from core.service import BaseService
from helpers import ServiceHelper
from models import Bot, Card, CardComment, CardCommentReaction, Project, User
from publishers import CardCommentPublisher
from ...tasks.activities import CardCommentActivityTask
from ...tasks.bots import CardCommentBotTask
from .NotificationService import NotificationService
from .ReactionService import ReactionService
from .Types import TCardParam, TCommentParam, TProjectParam, TUserOrBot


class CardCommentService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card_comment"

    async def get_by_uid(self, uid: str) -> CardComment | None:
        return ServiceHelper.get_by_param(CardComment, uid)

    async def get_board_list(self, card: TCardParam) -> list[dict[str, Any]]:
        card = ServiceHelper.get_by_param(Card, card)
        if not card:
            return []
        raw_comments = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(self.get_board_comment_api_query(card.id))
            raw_comments = result.all()

        reaction_service = self._get_service(ReactionService)
        reactions = await reaction_service.get_all(CardCommentReaction, [comment.id for comment, _, _ in raw_comments])

        comments = []
        for raw_comment in raw_comments:
            api_comment = self.convert_to_api_response(raw_comment, reactions.get(raw_comment[0].id))
            if api_comment:
                comments.append(api_comment)

        return comments

    async def get_board_comment(self, card: TCardParam, comment: TCommentParam) -> dict[str, Any] | None:
        if not comment:
            return None
        card = ServiceHelper.get_by_param(Card, card)
        if not card:
            return None
        comment_id = ServiceHelper.convert_id(comment)
        raw_comment = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(self.get_board_comment_api_query(card.id).where(CardComment.column("id") == comment_id))
            raw_comment = result.first()
        if not raw_comment:
            return None

        reaction_service = self._get_service(ReactionService)
        reactions = await reaction_service.get_all(CardCommentReaction, [comment_id])

        return self.convert_to_api_response(raw_comment, reactions.get(raw_comment[0].id))

    def get_board_comment_api_query(self, card_id: int):
        return (
            SqlBuilder.select.tables(CardComment, User, Bot, with_deleted=True)
            .outerjoin(User, CardComment.column("user_id") == User.column("id"))
            .outerjoin(Bot, CardComment.column("bot_id") == Bot.column("id"))
            .where(CardComment.column("card_id") == card_id)
            .order_by(
                CardComment.column("created_at").desc(),
                CardComment.column("id").desc(),
            )
            .group_by(
                CardComment.column("id"),
                CardComment.column("created_at"),
                User.column("id"),
                Bot.column("id"),
            )
        )

    def convert_to_api_response(
        self, result: tuple[CardComment, User, Bot], reaction: dict[str, list[str]] | None = None
    ) -> dict[str, Any] | None:
        comment, user, bot = result
        if comment.deleted_at is not None:
            return None
        api_comment = comment.api_response()
        if user:
            api_comment["user"] = user.api_response()
        else:
            api_comment["bot"] = bot.api_response()
        api_comment["reactions"] = reaction or {}
        return api_comment

    async def create(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        content: EditorContentModel | dict[str, Any],
    ) -> CardComment | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (Card, card))
        if not params:
            return None
        project, card = params

        if isinstance(content, dict):
            content = EditorContentModel(**content)

        comment_params = {
            "card_id": card.id,
            "content": content,
        }

        if isinstance(user_or_bot, User):
            comment_params["user_id"] = user_or_bot.id
        else:
            comment_params["bot_id"] = user_or_bot.id

        comment = CardComment(**comment_params)
        with DbSession.use(readonly=False) as db:
            db.insert(comment)

        await CardCommentPublisher.created(user_or_bot, project, card, comment)

        notification_service = self._get_service(NotificationService)
        await notification_service.notify_mentioned_in_comment(user_or_bot, project, card, comment)

        CardCommentActivityTask.card_comment_added(user_or_bot, project, card, comment)
        CardCommentBotTask.card_comment_added(user_or_bot, project, card, comment)

        return comment

    async def update(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        comment: TCommentParam,
        content: EditorContentModel | dict[str, Any],
    ) -> CardComment | None:
        params = ServiceHelper.get_records_with_foreign_by_params(
            (Project, project), (Card, card), (CardComment, comment)
        )
        if not params:
            return None
        project, card, comment = params

        if isinstance(content, dict):
            content = EditorContentModel(**content)

        old_content = comment.content
        comment.content = content
        with DbSession.use(readonly=False) as db:
            db.update(comment)

        await CardCommentPublisher.updated(project, card, comment)

        notification_service = self._get_service(NotificationService)
        await notification_service.notify_mentioned_in_comment(user_or_bot, project, card, comment)

        CardCommentActivityTask.card_comment_updated(user_or_bot, project, card, old_content, comment)
        CardCommentBotTask.card_comment_updated(user_or_bot, project, card, comment)

        return comment

    async def delete(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        comment: TCommentParam,
    ) -> CardComment | None:
        params = ServiceHelper.get_records_with_foreign_by_params(
            (Project, project), (Card, card), (CardComment, comment)
        )
        if not params:
            return None
        project, card, comment = params

        with DbSession.use(readonly=False) as db:
            db.delete(comment)

        await CardCommentPublisher.deleted(project, card, comment)
        CardCommentActivityTask.card_comment_deleted(user_or_bot, project, card, comment)
        CardCommentBotTask.card_comment_deleted(user_or_bot, project, card, comment)

        return comment

    async def toggle_reaction(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        comment: TCommentParam,
        reaction: str,
    ) -> bool | None:
        params = ServiceHelper.get_records_with_foreign_by_params(
            (Project, project), (Card, card), (CardComment, comment)
        )
        if not params:
            return None
        project, card, comment = params

        reaction_service = self._get_service(ReactionService)
        is_reacted = await reaction_service.toggle(user_or_bot, CardCommentReaction, comment.id, reaction)

        await CardCommentPublisher.reacted(user_or_bot, project, card, comment, reaction, is_reacted)

        if is_reacted and comment.user_id:
            notification_service = self._get_service(NotificationService)
            await notification_service.notify_reacted_to_comment(user_or_bot, project, card, comment, reaction)

        if is_reacted:
            CardCommentActivityTask.card_comment_reacted(user_or_bot, project, card, comment, reaction)
            CardCommentBotTask.card_comment_reacted(user_or_bot, project, card, comment, reaction)
        else:
            CardCommentActivityTask.card_comment_unreacted(user_or_bot, project, card, comment, reaction)
            CardCommentBotTask.card_comment_unreacted(user_or_bot, project, card, comment, reaction)

        return is_reacted
