from typing import Any
from ...core.broker import Broker
from ...models import Bot, Project, ProjectColumn, User
from ...models.bases import BotTriggerCondition
from .utils import BotTaskDataHelper, BotTaskHelper, BotTaskSchemaHelper


@BotTaskSchemaHelper.project_column_schema(BotTriggerCondition.ProjectColumnNameChanged)
@Broker.wrap_async_task_decorator
async def project_column_name_changed(user_or_bot: User | Bot, project: Project, column: ProjectColumn):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.ProjectColumnNameChanged, project_id=project.id, project_column_id=column.id
    )
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectColumnNameChanged, create_column_data(user_or_bot, project, column), project
    )


@BotTaskSchemaHelper.project_column_schema(BotTriggerCondition.ProjectColumnDeleted)
@Broker.wrap_async_task_decorator
async def project_column_deleted(user_or_bot: User | Bot, project: Project, column: ProjectColumn):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.ProjectColumnDeleted, project_id=project.id, project_column_id=column.id
    )
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectColumnDeleted, create_column_data(user_or_bot, project, column), project
    )


def create_column_data(
    user_or_bot: User | Bot,
    project: Project,
    column: ProjectColumn,
    other_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_project_column(user_or_bot, project, column),
        **(other_data or {}),
    }
