from typing import Any
from ....ai import BotDefaultTrigger
from ....core.utils.decorators import staticclass
from ....models import Bot, User
from ....models.bases import BotTriggerCondition
from ...webhooks.utils import WebhookDataHelper


@staticclass
class BotTaskSchemaHelper:
    @staticmethod
    def schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return WebhookDataHelper.schema(condition.value, schema)

    @staticmethod
    def executor_schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return BotTaskSchemaHelper.schema(
            condition, {"executor": BotTaskSchemaHelper.create_user_or_bot_schema(), **(schema or {})}
        )

    @staticmethod
    def project_schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return BotTaskSchemaHelper.schema(
            condition,
            {
                "project_uid": "string",
                "executor": BotTaskSchemaHelper.create_user_or_bot_schema(),
                **(schema or {}),
            },
        )

    @staticmethod
    def project_column_schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return BotTaskSchemaHelper.schema(
            condition,
            {
                "project_uid": "string",
                "project_column_uid": "string",
                "executor": BotTaskSchemaHelper.create_user_or_bot_schema(),
                **(schema or {}),
            },
        )

    @staticmethod
    def card_schema(condition: BotTriggerCondition | BotDefaultTrigger, schema: dict[str, Any] | None = None):
        return BotTaskSchemaHelper.schema(
            condition,
            {
                "project_uid": "string",
                "project_column_uid": "string",
                "card_uid": "string",
                "executor": BotTaskSchemaHelper.create_user_or_bot_schema(),
                **(schema or {}),
            },
        )

    @staticmethod
    def changes_schema(*fields: tuple[str, str | dict]):
        changes = {}
        for field, type_ in fields:
            changes[f"old_{field}"] = type_
            changes[f"new_{field}"] = type_
        return {"changes": changes}

    @staticmethod
    def create_user_or_bot_schema():
        return {"oneOf": {"User": User.api_schema(), "Bot": Bot.api_schema()}}
