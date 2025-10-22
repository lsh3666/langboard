from typing import Any, overload
from core.db import BaseSqlModel, DbSession, SqlBuilder
from core.utils.decorators import staticclass
from helpers import BotHelper
from models import Bot, Project
from models.bases import BotTriggerCondition
from ....ai import BotDefaultTrigger
from ....core.logger import Logger
from ...models import WebhookModel
from ...WebhookTask import webhook_task
from .requests.Utils import create_request


logger = Logger.use("BotTask")


@staticclass
class BotTaskHelper:
    @staticmethod
    def get_scoped_bots(condition: BotTriggerCondition, **where_clauses: Any) -> list[tuple[Bot, BaseSqlModel]]:
        model_classes = BotHelper.get_scope_model_classes_by_condition(condition)
        records: list[tuple[Bot, BaseSqlModel]] = []
        with DbSession.use(readonly=True) as db:
            for model_class in model_classes:
                column_name = model_class.get_scope_column_name()
                if column_name not in where_clauses or not where_clauses[column_name]:
                    continue

                target_table = BotHelper.get_target_table_by_bot_model("scope", model_class)
                if not target_table:
                    continue

                target_table_class = BotHelper.AVAILABLE_TARGET_TABLES[target_table]

                result = db.exec(
                    SqlBuilder.select.tables(Bot, model_class, target_table_class)
                    .join(model_class, model_class.column("bot_id") == Bot.column("id"))
                    .join(
                        target_table_class,
                        target_table_class.column("id") == model_class.column(column_name),
                    )
                    .where(
                        (model_class.column("conditions").contains([condition.value]))
                        & (model_class.column(column_name) == where_clauses[column_name])
                    )
                )
                records.extend([(bot, scope_model) for bot, _, scope_model in result.all()])
        return records

    @overload
    @staticmethod
    async def run(
        bots: Bot | list[Bot],
        event: BotTriggerCondition | BotDefaultTrigger,
        data: dict[str, Any],
        project: Project | None = None,
        scope_model: BaseSqlModel | None = None,
    ): ...
    @overload
    @staticmethod
    async def run(
        bots: list[tuple[Bot, BaseSqlModel]],
        event: BotTriggerCondition | BotDefaultTrigger,
        data: dict[str, Any],
        project: Project | None = None,
    ): ...
    @staticmethod
    async def run(
        bots: Bot | list[Bot] | list[tuple[Bot, BaseSqlModel]],
        event: BotTriggerCondition | BotDefaultTrigger,
        data: dict[str, Any],
        project: Project | None = None,
        scope_model: BaseSqlModel | None = None,
    ):
        if not isinstance(bots, list):
            bots = [bots]

        webhook_task(WebhookModel(event=event.value, data=data))

        for bot in bots:
            if isinstance(bot, tuple):
                bot, scope_model = bot
            request = create_request(bot, event.value, data, project, scope_model)
            if not request:
                continue
            await request.execute()
