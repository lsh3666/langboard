from typing import Any, Callable, TypeVar
from sqlmodel.sql.expression import SelectOfScalar
from ...core.db import BaseSqlModel, DbSession, SqlBuilder
from ...core.service import BaseService
from ...helpers import ServiceHelper
from ...models import Bot
from ...models.bases import BaseBotScopeModel, BotTriggerCondition
from .Types import TBaseParam, TBotParam


_TBotScopeModel = TypeVar("_TBotScopeModel", bound=BaseBotScopeModel)


class BotScopeService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "bot_scope"

    async def get_list(
        self,
        model_class: type[_TBotScopeModel],
        set_query: Callable[[SelectOfScalar[_TBotScopeModel]], SelectOfScalar[_TBotScopeModel]] | None = None,
        **where_clauses: Any,
    ) -> list[_TBotScopeModel]:
        query = SqlBuilder.select.table(model_class)

        if set_query:
            query = set_query(query)

        if where_clauses:
            query = ServiceHelper.where_recursive(query, model_class, **where_clauses)

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            records = result.all()

        return records

    async def create(
        self,
        model_class: type[_TBotScopeModel],
        bot: TBotParam,
        scope: BaseSqlModel,
        conditions: list[BotTriggerCondition],
        **kwargs: Any,
    ) -> _TBotScopeModel | None:
        bot = ServiceHelper.get_by_param(Bot, bot)
        if not bot:
            return None

        model_params = {
            "bot_id": bot.id,
            "conditions": [condition.value for condition in conditions],
            **kwargs,
        }

        model_params[model_class.get_scope_column_name()] = scope.id

        model = model_class(**model_params)

        with DbSession.use(readonly=False) as db:
            db.insert(model)

        return model

    async def toggle_trigger_condition(
        self,
        model_class: type[_TBotScopeModel],
        model: _TBotScopeModel | TBaseParam,
        condition: BotTriggerCondition,
    ):
        model = ServiceHelper.get_by_param(model_class, model)
        if not model:
            return False

        if condition not in model_class.get_available_conditions():
            return True

        new_conditions = [*model.conditions]
        should_enable = condition.value not in new_conditions
        if should_enable:
            new_conditions.append(condition.value)
        else:
            new_conditions.remove(condition.value)
        model.conditions = new_conditions

        with DbSession.use(readonly=False) as db:
            db.update(model)

        return True

    async def delete(
        self, model_class: type[_TBotScopeModel], model: _TBotScopeModel | TBaseParam
    ) -> _TBotScopeModel | None:
        model = ServiceHelper.get_by_param(model_class, model)
        if not model:
            return None

        with DbSession.use(readonly=False) as db:
            db.delete(model)

        return model

    async def delete_by_scope(self, model_class: type[_TBotScopeModel], scope: BaseSqlModel) -> list[_TBotScopeModel]:
        query = SqlBuilder.select.table(model_class).where(
            model_class.column(model_class.get_scope_column_name()) == scope.id
        )

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            records = result.all()

        if not records:
            return []

        with DbSession.use(readonly=False) as db:
            for record in records:
                db.delete(record)

        return records
