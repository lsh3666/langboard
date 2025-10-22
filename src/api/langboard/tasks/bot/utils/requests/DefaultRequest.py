from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any
from core.Env import Env
from httpx import TimeoutException, post
from models import BotLog
from models.BaseBotModel import BotPlatform, BotPlatformRunningType
from models.bases import BaseBotLogModel
from models.BotLog import BotLogType
from .....ai import LangboardCalledVariablesComponent
from .....core.logger import Logger
from .LangflowRequest import LangflowRequest


logger = Logger.use("BotTask")


class DefaultRequest(LangflowRequest):
    def create_request_data(self, bot_log: tuple[BotLog, BaseBotLogModel | None]):
        request_data = super().create_request_data(bot_log)

        if self._bot.platform_running_type == BotPlatformRunningType.Default:
            request_data["url"] = f"{self._base_url}/api/v1/webhook/{self._bot.id}"
            request_data["data"]["tweaks"] = self.__set_default_tweaks(request_data["data"]["tweaks"])

        return request_data

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

    def __set_default_tweaks(self, tweaks: dict[str, Any]) -> dict[str, Any]:
        try:
            bot_value: dict = json_loads(json_dumps(json_loads(self._bot.value or "{}")))
            agent_llm = bot_value.pop("agent_llm", "")
            if not agent_llm:
                raise ValueError("agent_llm is required for Default platform")

            if agent_llm in {"Ollama", "LM Studio"}:
                tweaks[agent_llm] = bot_value
            else:
                bot_value["agent_llm"] = agent_llm
                tweaks["Agent"] = bot_value

            if "base_url" in tweaks:
                del tweaks["base_url"]

            if "Ollama" in tweaks and tweaks["Ollama"].get("base_url", "") == "default":
                tweaks["Ollama"]["base_url"] = Env.OLLAMA_API_URL

            possible_agents = ["", "Agent", "Ollama", "LM Studio"]
            for possible_key in possible_agents:
                agent_data = tweaks if not possible_key else tweaks.get(possible_key, {})

                if "system_prompt" in agent_data:
                    system_prompt = agent_data.pop("system_prompt", "")
                    tweaks["Prompt"] = {"prompt": system_prompt}

                if "api_names" in agent_data:
                    api_names = agent_data.pop("api_names", [])
                    tweaks["api_names"] = api_names
                    tweaks[LangboardCalledVariablesComponent.__name__]["api_names"] = api_names
        except Exception:
            pass

        return tweaks
