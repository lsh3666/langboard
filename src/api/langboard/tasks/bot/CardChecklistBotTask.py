from typing import Any
from models import Bot, Card, Checklist, Project, User
from models.bases import BotTriggerCondition
from ...core.broker import Broker
from .utils import BotTaskDataHelper, BotTaskHelper, BotTaskSchemaHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "checklist_uid": "string",
        **(other_schema or {}),
    }


@BotTaskSchemaHelper.card_schema(BotTriggerCondition.CardChecklistCreated, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_created(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.CardChecklistCreated, project_column_id=card.project_column_id, card_id=card.id
    )
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistCreated,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskSchemaHelper.card_schema(BotTriggerCondition.CardChecklistTitleChanged, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_title_changed(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.CardChecklistTitleChanged, project_column_id=card.project_column_id, card_id=card.id
    )
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistTitleChanged,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskSchemaHelper.card_schema(BotTriggerCondition.CardChecklistChecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_checked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.CardChecklistChecked, project_column_id=card.project_column_id, card_id=card.id
    )
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistChecked,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskSchemaHelper.card_schema(BotTriggerCondition.CardChecklistUnchecked, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_unchecked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.CardChecklistUnchecked, project_column_id=card.project_column_id, card_id=card.id
    )
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistUnchecked,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


@BotTaskSchemaHelper.card_schema(BotTriggerCondition.CardChecklistDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def card_checklist_deleted(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    bots = BotTaskHelper.get_scoped_bots(
        BotTriggerCondition.CardChecklistDeleted, project_column_id=card.project_column_id, card_id=card.id
    )
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.CardChecklistDeleted,
        _create_data(user_or_bot, project, card, checklist),
        project,
    )


def _create_data(
    user_or_bot: User | Bot,
    project: Project,
    card: Card,
    checklist: Checklist,
    other_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_card(user_or_bot, project, card),
        "checklist_uid": checklist.get_uid(),
        **(other_data or {}),
    }
