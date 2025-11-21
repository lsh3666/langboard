from typing import Any, TypeVar
from ....core.db import BaseSqlModel
from ....core.domain import BaseDomainService
from ....core.schema import TimeBasedPagination
from ....domain.models import Bot
from ....domain.models.bases import BaseBotLogModel


_TBotLogModel = TypeVar("_TBotLogModel", bound=BaseBotLogModel)


class BotLogService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "bot_log"

    async def get_api_list_by_scope(
        self,
        log_model_class: type[_TBotLogModel],
        bot: Bot,
        scope_model: BaseSqlModel,
        pagination: TimeBasedPagination | None = None,
    ) -> list[dict[str, Any]]:
        logs = self.repo.bot_log.get_all_by_scope(
            log_model_class,
            bot,
            scope_model,
            pagination,
        )

        api_logs = []
        for log_model, log in logs:
            api_log = {**log.api_response(), **log_model.api_response()}
            api_logs.append(api_log)

        return api_logs
