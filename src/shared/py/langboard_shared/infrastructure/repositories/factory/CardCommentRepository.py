from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TCardParam, TCommentParam
from ....domain.models import Bot, CardComment, User
from ....helpers import InfraHelper


class CardCommentRepository(BaseRepository[CardComment]):
    @staticmethod
    def model_cls():
        return CardComment

    @staticmethod
    def name() -> str:
        return "card_comment"

    def get_list_by_card(self, card: TCardParam):
        card_id = InfraHelper.convert_id(card)
        comments = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(self.__get_board_comment_api_query(card_id))
            comments = result.all()

        return comments

    def get_one(self, card: TCardParam, comment: TCommentParam):
        card_id = InfraHelper.convert_id(card)
        comment_id = InfraHelper.convert_id(comment)
        record = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(self.__get_board_comment_api_query(card_id).where(CardComment.column("id") == comment_id))
            record = result.first()
        return record

    def __get_board_comment_api_query(self, card_id: int):
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
