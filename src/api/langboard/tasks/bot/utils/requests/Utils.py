from typing import Any
from core.db import BaseSqlModel
from core.Env import Env
from models import Bot, Project
from models.BaseBotModel import BotPlatform, BotPlatformRunningType
from .BaseBotRequest import BaseBotRequest
from .DefaultRequest import DefaultRequest
from .LangflowRequest import LangflowRequest


def create_request(
    bot: Bot,
    event: str,
    data: dict[str, Any],
    project: Project | None,
    scope_model: BaseSqlModel | None,
) -> BaseBotRequest | None:
    if bot.platform == BotPlatform.Default:
        if bot.platform_running_type == BotPlatformRunningType.Default:
            return DefaultRequest(bot, Env.DEFAULT_FLOWS_URL, event, data, project, scope_model)
        return None

    if bot.platform == BotPlatform.Langflow:
        if bot.platform_running_type == BotPlatformRunningType.Endpoint:
            return LangflowRequest(bot, bot.api_url, event, data, project, scope_model)
        if bot.platform_running_type == BotPlatformRunningType.FlowJson:
            return LangflowRequest(bot, Env.DEFAULT_FLOWS_URL, event, data, project, scope_model)
        return None

    return None
