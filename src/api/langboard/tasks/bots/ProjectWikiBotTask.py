from typing import Any
from models import Bot, Project, ProjectWiki, User
from models.bases import BotTriggerCondition
from ...core.broker import Broker
from .utils import BotTaskDataHelper, BotTaskHelper, BotTaskSchemaHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "project_wiki_uid": "string",
        **(other_schema or {}),
    }


@BotTaskSchemaHelper.project_schema(BotTriggerCondition.ProjectWikiCreated, _create_schema())
@Broker.wrap_async_task_decorator
async def project_wiki_created(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.ProjectWikiCreated, project_id=project.id, project_wiki_id=wiki.id
    )
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectWikiCreated, create_wiki_data(user_or_bot, project, wiki), project
    )


@BotTaskSchemaHelper.project_schema(BotTriggerCondition.ProjectWikiUpdated, _create_schema())
@Broker.wrap_async_task_decorator
async def project_wiki_updated(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.ProjectWikiUpdated, project_id=project.id, project_wiki_id=wiki.id
    )
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectWikiUpdated, create_wiki_data(user_or_bot, project, wiki), project
    )


@BotTaskSchemaHelper.project_schema(BotTriggerCondition.ProjectWikiPublicityChanged, _create_schema())
@Broker.wrap_async_task_decorator
async def project_wiki_publicity_changed(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.ProjectWikiPublicityChanged, project_id=project.id, project_wiki_id=wiki.id
    )
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectWikiPublicityChanged, create_wiki_data(user_or_bot, project, wiki), project
    )


@BotTaskSchemaHelper.project_schema(BotTriggerCondition.ProjectWikiDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def project_wiki_deleted(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.ProjectWikiDeleted, project_id=project.id, project_wiki_id=wiki.id
    )
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectWikiDeleted, create_wiki_data(user_or_bot, project, wiki), project
    )


def create_wiki_data(
    user_or_bot: User | Bot, project: Project, wiki: ProjectWiki, other_data: dict[str, Any] | None = None
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_project(user_or_bot, project),
        "project_wiki_uid": wiki.get_uid(),
        **(other_data or {}),
    }
