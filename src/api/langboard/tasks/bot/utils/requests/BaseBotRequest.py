from abc import ABC, abstractmethod
from typing import Any, TypedDict
from core.db import BaseSqlModel, DbSession
from helpers import BotHelper
from models import Bot, BotLog, Project
from models.BaseBotModel import BotPlatform
from models.bases import BaseBotLogModel
from models.BotLog import BotLogMessage, BotLogType
from publishers import ProjectBotPublisher
from .....core.logger import Logger


logger = Logger.use("BotTask")


class RequestData(TypedDict, total=True):
    url: str
    data: dict[str, Any]


class BaseBotRequest(ABC):
    def __init__(
        self,
        bot: Bot,
        base_url: str,
        event: str,
        data: dict[str, Any],
        project: Project | None,
        scope_model: BaseSqlModel | None,
    ):
        self._bot = bot
        self._base_url = base_url.rstrip("/")
        self._event = event
        self._data = data
        self._project = project
        self._scope_model = scope_model

    async def execute(self) -> None:
        bot_log = await self._create_log(BotLogType.Info, f"'{self._event}' task started")

        request_data = self.create_request_data(bot_log)
        if not request_data:
            await self._update_log(bot_log, BotLogType.Error, "Invalid request data")
            return

        headers = self._get_bot_request_headers()

        await self.request(request_data, headers, bot_log)

    @abstractmethod
    def create_request_data(self, bot_log: tuple[BotLog, BaseBotLogModel | None]) -> RequestData: ...

    @abstractmethod
    async def request(
        self,
        request_data: RequestData,
        headers: dict[str, Any],
        bot_log: tuple[BotLog, BaseBotLogModel | None],
        retried: int = 0,
    ) -> None: ...

    def _get_bot_request_headers(self) -> dict[str, Any]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        if self._bot.platform == BotPlatform.Default:
            pass
        elif self._bot.platform == BotPlatform.Langflow:
            headers["x-api-key"] = self._bot.api_key
        else:
            pass

        return headers

    async def _create_log(self, log_type: BotLogType, message: str):
        bot_log = BotLog(
            bot_id=self._bot.id,
            log_type=log_type,
            message_stack=[BotLogMessage(message=message, log_type=log_type)],
        )

        with DbSession.use(readonly=False) as db:
            db.insert(bot_log)

        if not self._scope_model:
            return bot_log, None

        log_class = BotHelper.get_bot_model_class("log", self._scope_model.__tablename__)
        if not log_class:
            return bot_log, None

        params: dict[str, Any] = {
            f"{self._scope_model.__tablename__}_id": self._scope_model.id,
            "bot_log_id": bot_log.id,
        }

        scope_log = log_class(**params)
        with DbSession.use(readonly=False) as db:
            db.insert(scope_log)

        if self._project:
            await ProjectBotPublisher.log_created(self._project, (bot_log, scope_log))
        return bot_log, scope_log

    async def _update_log(
        self,
        bot_log: tuple[BotLog, BaseBotLogModel | None],
        log_type: BotLogType,
        stack: str,
    ) -> None:
        log, scope_log = bot_log
        log.log_type = log_type
        log_stack = BotLogMessage(message=stack, log_type=log_type)
        message_stack = log.message_stack
        message_stack.append(log_stack)
        log.message_stack = message_stack

        with DbSession.use(readonly=False) as db:
            db.update(log)

        if self._project and scope_log:
            await ProjectBotPublisher.log_stack_added(self._project, log, log_stack)
