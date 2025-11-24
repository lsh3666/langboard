from typing import Any, Callable, TypeVar
from sqlmodel.sql.expression import SelectOfScalar
from ..core.db import BaseSqlModel, DbSession, SqlBuilder
from ..core.types.ParamTypes import TBaseParam, TBotParam
from ..core.utils.decorators import staticclass
from ..domain.models import Bot
from ..domain.models.bases import BaseBotScopeModel, BotTriggerCondition
from ..helpers import InfraHelper


_TBotScopeModel = TypeVar("_TBotScopeModel", bound=BaseBotScopeModel)


@staticclass
class BotScopeHelper:
    @staticmethod
    def get_by_id_like(
        model_cls: type[_TBotScopeModel], model: _TBotScopeModel | TBaseParam | None
    ) -> _TBotScopeModel | None:
        record = InfraHelper.get_by_id_like(model_cls, model)
        return record

    @staticmethod
    def get_list(
        model_cls: type[_TBotScopeModel],
        set_query: Callable[[SelectOfScalar[_TBotScopeModel]], SelectOfScalar[_TBotScopeModel]] | None = None,
        **where_clauses: Any,
    ) -> list[_TBotScopeModel]:
        query = SqlBuilder.select.table(model_cls)

        if set_query:
            query = set_query(query)

        if where_clauses:
            query = InfraHelper.where_recursive(query, model_cls, **where_clauses)

        records = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            records = result.all()

        return records

    @staticmethod
    def create(
        model_cls: type[_TBotScopeModel],
        bot: TBotParam | None,
        scope: BaseSqlModel,
        conditions: list[BotTriggerCondition],
        **kwargs: Any,
    ) -> _TBotScopeModel | None:
        bot = InfraHelper.get_by_id_like(Bot, bot)
        if not bot:
            return None

        model_params = {
            "bot_id": bot.id,
            "conditions": conditions,
            **kwargs,
        }

        model_params[model_cls.get_scope_column_name()] = scope.id

        model = model_cls(**model_params)

        with DbSession.use(readonly=False) as db:
            db.insert(model)

        return model

    @staticmethod
    def toggle_trigger_condition(
        model_cls: type[_TBotScopeModel],
        model: _TBotScopeModel | TBaseParam | None,
        condition: BotTriggerCondition,
    ):
        model = InfraHelper.get_by_id_like(model_cls, model)
        if not model:
            return False

        if condition not in model_cls.get_available_conditions():
            return True

        new_conditions = [*model.conditions]
        should_enable = condition not in new_conditions
        if should_enable:
            new_conditions.append(condition)
        else:
            new_conditions.remove(condition)
        model.conditions = new_conditions

        with DbSession.use(readonly=False) as db:
            db.update(model)

        return True

    @staticmethod
    def delete(model_cls: type[_TBotScopeModel], model: _TBotScopeModel | TBaseParam | None) -> _TBotScopeModel | None:
        model = InfraHelper.get_by_id_like(model_cls, model)
        if not model:
            return None

        with DbSession.use(readonly=False) as db:
            db.delete(model)

        return model

    @staticmethod
    def delete_by_scope(model_cls: type[_TBotScopeModel], scope: BaseSqlModel) -> list[_TBotScopeModel]:
        query = SqlBuilder.select.table(model_cls).where(
            model_cls.column(model_cls.get_scope_column_name()) == scope.id
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
