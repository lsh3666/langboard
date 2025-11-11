from typing import Any, Literal, TypeVar, overload
from ...core.db import BaseSqlModel, DbSession, SqlBuilder
from ...core.schema import Pagination
from ...core.service import BaseService
from ...core.types import SafeDateTime
from ...models import Bot, BotLog
from ...models.bases import BaseBotLogModel


_TBotLogModel = TypeVar("_TBotLogModel", bound=BaseBotLogModel)


class BotLogService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "bot_log"

    @overload
    async def get_all_by_scope(
        self,
        log_model_class: type[_TBotLogModel],
        bot: Bot,
        scope_model: BaseSqlModel,
        as_api: Literal[False],
        pagination: Pagination | None = None,
        refer_time: SafeDateTime | None = None,
    ) -> list[tuple[_TBotLogModel, BotLog]]: ...
    @overload
    async def get_all_by_scope(
        self,
        log_model_class: type[_TBotLogModel],
        bot: Bot,
        scope_model: BaseSqlModel,
        as_api: Literal[True],
        pagination: Pagination | None = None,
        refer_time: SafeDateTime | None = None,
    ) -> list[dict[str, Any]]: ...
    async def get_all_by_scope(
        self,
        log_model_class: type[_TBotLogModel],
        bot: Bot,
        scope_model: BaseSqlModel,
        as_api: bool,
        pagination: Pagination | None = None,
        refer_time: SafeDateTime | None = None,
    ) -> list[tuple[_TBotLogModel, BotLog]] | list[dict[str, Any]]:
        query = (
            SqlBuilder.select.tables(log_model_class, BotLog)
            .join(BotLog, BotLog.column("id") == log_model_class.column("bot_log_id"))
            .where(
                (BotLog.column("bot_id") == bot.id)
                & (log_model_class.column(f"{scope_model.__tablename__}_id") == scope_model.id)
            )
            .order_by(log_model_class.column("updated_at").desc())
        )

        if refer_time is not None:
            query = query.where(log_model_class.column("created_at") <= refer_time)

        if pagination:
            query = query.limit(pagination.limit).offset((pagination.page - 1) * pagination.limit)

        logs = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            logs = result.all()

        if not as_api:
            return logs

        api_logs = []
        for log_model, log in logs:
            api_log = {
                **log.api_response(),
                **log_model.api_response(),
            }
            api_logs.append(api_log)

        return api_logs
