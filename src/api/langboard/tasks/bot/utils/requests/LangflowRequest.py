from json import dumps as json_dumps
from json import loads as json_loads
from core.utils.Converter import json_default
from httpx import TimeoutException, post
from models import BotLog
from models.BaseBotModel import BotPlatform, BotPlatformRunningType
from models.bases import BaseBotLogModel
from models.BotLog import BotLogType
from .....ai import LangboardCalledVariablesComponent
from .....core.logger import Logger
from ..BotTaskDataHelper import BotTaskDataHelper
from .BaseBotRequest import BaseBotRequest, RequestData


logger = Logger.use("BotTask")


class LangflowRequest(BaseBotRequest):
    def create_request_data(self, bot_log: tuple[BotLog, BaseBotLogModel | None]):
        project_uid = self._project.get_uid() if self._project else None
        session_id = f"{self._bot.get_uid()}-{project_uid}"
        if session_id.endswith("-"):
            session_id = session_id[:-1]

        log, scope_log = bot_log

        component = LangboardCalledVariablesComponent(
            event=self._event,
            app_api_token=self._bot.app_api_token,
            project_uid=project_uid,
            current_runner_type="bot",
            current_runner_data=BotTaskDataHelper.create_user_or_bot(self._bot),
            rest_data=json_loads(json_dumps(self._data, default=json_default)),
        )

        request_data = {
            "input_value": "",
            "input_type": "chat",
            "output_type": "chat",
            "session_id": session_id,
            "session": session_id,
            "run_type": "bot",
            "uid": self._bot.get_uid(),
            "project_uid": project_uid,
            "log_uid": log.get_uid(),
            "scope_log_table": scope_log.__tablename__ if scope_log else None,
            "tweaks": {
                **component.to_data(),
                **component.to_tweaks(),
            },
        }

        url = self._base_url
        if self._bot.platform_running_type == BotPlatformRunningType.Endpoint:
            url = f"{self._base_url}/{self._bot.value.lstrip('/')}"
        elif self._bot.platform_running_type == BotPlatformRunningType.FlowJson:
            url = f"{self._base_url}/api/v1/webhook/{self._bot.id}"

        return RequestData(
            {
                "url": url,
                "data": request_data,
            }
        )

    async def request(self, request_data, headers, bot_log, retried=0) -> None:
        res = None
        try:
            res = post(
                url=request_data["url"],
                headers=headers,
                json=request_data["data"],
                timeout=120,
            )
            res.raise_for_status()
            text = res.text
            logger.info("Successfully requested bot: %s(@%s)", self._bot.name, self._bot.bot_uname)
            log_type = BotLogType.Success
            message = "Request successfully executed"
            if self._bot.platform == BotPlatform.Default:
                log_type = BotLogType.Info
            elif self._bot.platform == BotPlatform.Langflow:
                if self._bot.platform_running_type == BotPlatformRunningType.FlowJson:
                    log_type = BotLogType.Info
                elif self._bot.platform_running_type == BotPlatformRunningType.Endpoint:
                    log_type = BotLogType.Success
            await self._update_log(bot_log, log_type, text if text else message)
        except TimeoutException as e:
            if retried < 5:
                return await self.request(request_data, headers, bot_log, retried + 1)
            logger.error("Timeout while requesting bot: %s", e)
            await self._update_log(bot_log, BotLogType.Error, str(e))
        except Exception as e:
            if res:
                logger.error(
                    "Failed to request bot: %s(@%s) %s: %s",
                    self._bot.name,
                    self._bot.bot_uname,
                    str(res.status_code),
                    res.text,
                )
                await self._update_log(bot_log, BotLogType.Error, f"{res.status_code}: {res.text}")
            else:
                logger.error("Failed to request bot: %s(@%s)", self._bot.name, self._bot.bot_uname)
                await self._update_log(bot_log, BotLogType.Error, str(e))
