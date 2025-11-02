from ...core.db import DbSession, SqlBuilder
from ...core.service import BaseService
from ...core.types import SnowflakeID
from ...models import Bot, User
from ...models.bases import BaseReactionModel
from .Types import TUserOrBot


class ReactionService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "reaction"

    async def get_all(
        self, model_class: type[BaseReactionModel], target_ids: SnowflakeID | list[SnowflakeID]
    ) -> dict[int, dict[str, list[str]]]:
        if not isinstance(target_ids, list):
            target_ids = [target_ids]

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.tables(model_class, User, Bot)
                .outerjoin(User, model_class.column("user_id") == User.column("id"))
                .outerjoin(Bot, model_class.column("bot_id") == Bot.column("id"))
                .where(model_class.column(model_class.get_target_column_name()).in_(target_ids))
            )
            records = result.all()

        reactions: dict[int, dict[str, list[str]]] = {}
        for reaction, reacted_user, reacted_bot in records:
            reaction_type = reaction.reaction_type
            reaction_target_column_name = model_class.get_target_column_name()
            reaction_target_id = getattr(reaction, reaction_target_column_name)
            if reaction_target_id not in reactions:
                reactions[reaction_target_id] = {}
            if reaction_type not in reactions[reaction_target_id]:
                reactions[reaction_target_id][reaction_type] = []
            reactions[reaction_target_id][reaction_type].append(
                reacted_user.get_uid() if reacted_user else reacted_bot.get_uid()
            )

        return reactions

    async def toggle(
        self,
        user_or_bot: TUserOrBot,
        model_class: type[BaseReactionModel],
        target_id: SnowflakeID,
        reaction_type: str,
    ) -> bool:
        user_or_bot_column = (
            model_class.column("user_id") if isinstance(user_or_bot, User) else model_class.column("bot_id")
        )
        reaction = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(model_class).where(
                    (user_or_bot_column == user_or_bot.id)
                    & (model_class.column(model_class.get_target_column_name()) == target_id)
                    & (model_class.column("reaction_type") == reaction_type)
                )
            )
            reaction = result.first()
        is_reacted = bool(reaction)

        with DbSession.use(readonly=False) as db:
            if is_reacted:
                db.delete(reaction)
            else:
                reaction_params = {
                    "reaction_type": reaction_type,
                    model_class.get_target_column_name(): target_id,
                }

                if isinstance(user_or_bot, User):
                    reaction_params["user_id"] = user_or_bot.id
                else:
                    reaction_params["bot_id"] = user_or_bot.id

                reaction = model_class(**reaction_params)
                db.insert(reaction)

        return not is_reacted
