from json import dumps as json_dumps
from typing import Any, Literal, overload
from ...core.db import DbSession
from ...core.service import BaseService
from ...core.storage import FileModel
from ...core.utils.Converter import convert_python_data
from ...core.utils.IpAddress import is_valid_ipv4_address_or_range, make_valid_ipv4_range
from ...core.utils.String import generate_random_string
from ...helpers import ServiceHelper
from ...models import AppSetting, Bot
from ...models.BaseBotModel import BotPlatform, BotPlatformRunningType
from ...models.Bot import ALLOWED_ALL_IPS
from ...publishers import BotPublisher
from ...tasks.bots import BotDefaultTask
from .Types import TBotParam


class BotService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "bot"

    async def get_by_uid(self, uid: str) -> Bot | None:
        return ServiceHelper.get_by_param(Bot, uid)

    @overload
    async def get_list(self, as_api: Literal[False], is_setting: bool = False) -> list[Bot]: ...
    @overload
    async def get_list(self, as_api: Literal[True], is_setting: bool = False) -> list[dict[str, Any]]: ...
    async def get_list(self, as_api: bool, is_setting: bool = False) -> list[Bot] | list[dict[str, Any]]:
        bots = ServiceHelper.get_all(Bot)
        if not as_api:
            return bots
        api_bots = []
        for bot in bots:
            api_bot = bot.api_response(is_setting=is_setting)
            api_bots.append(api_bot)
        return api_bots

    async def create(
        self,
        name: str,
        bot_uname: str,
        platform: BotPlatform,
        platform_running_type: BotPlatformRunningType,
        api_url: str,
        api_key: str,
        ip_whitelist: list[str],
        value: str | None = None,
        avatar: FileModel | None = None,
    ) -> Bot | None:
        existing_bot = ServiceHelper.get_by(Bot, "bot_uname", bot_uname)
        if existing_bot:
            return None

        bot = Bot(
            name=name,
            bot_uname=bot_uname,
            platform=platform,
            platform_running_type=platform_running_type,
            avatar=avatar,
            api_url=api_url,
            api_key=api_key,
            app_api_token=await self.generate_api_key(),
            ip_whitelist=self.filter_valid_ip_whitelist(ip_whitelist),
            value=value or "",
        )

        with DbSession.use(readonly=False) as db:
            db.insert(bot)

        await BotPublisher.bot_created(bot)
        BotDefaultTask.bot_created(bot)

        return bot

    async def update(self, bot: TBotParam, form: dict) -> bool | tuple[Bot, dict[str, Any]] | None:
        bot = ServiceHelper.get_by_param(Bot, bot)
        if not bot:
            return None
        mutable_keys = [
            "name",
            "bot_uname",
            "avatar",
            "api_url",
            "platform",
            "platform_running_type",
            "api_key",
            "value",
        ]
        unpublishable_keys = [
            "api_url",
            "platform",
            "platform_running_type",
            "api_key",
            "value",
        ]

        old_bot_record = {}

        for key in mutable_keys:
            if key not in form or not hasattr(bot, key):
                continue
            old_value = getattr(bot, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_bot_record[key] = convert_python_data(old_value)
            setattr(bot, key, new_value)

        available_running_types = Bot.AVAILABLE_RUNNING_TYPES_BY_PLATFORM[bot.platform]
        if bot.platform_running_type not in available_running_types:
            old_bot_record["platform_running_type"] = convert_python_data(bot.platform_running_type)
            bot.platform_running_type = available_running_types[0]

        if "bot_uname" in form:
            existing_bot = ServiceHelper.get_by(Bot, "bot_uname", form["bot_uname"])
            if existing_bot:
                return False

        if "delete_avatar" in form and form["delete_avatar"]:
            old_bot_record["avatar"] = convert_python_data(bot.avatar)
            bot.avatar = None

        if not old_bot_record:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(bot)

        model: dict[str, Any] = {}
        unpublishable_model: dict[str, Any] = {}
        for key in form:
            if key in unpublishable_keys:
                if key in old_bot_record:
                    unpublishable_model[key] = convert_python_data(getattr(bot, key))
                continue

            if key not in mutable_keys or key not in old_bot_record:
                continue
            if key == "avatar":
                if bot.avatar:
                    model[key] = bot.avatar.path
                else:
                    model["deleted_avatar"] = True
            else:
                model[key] = convert_python_data(getattr(bot, key))

        await BotPublisher.bot_updated(bot.get_uid(), model)
        await BotPublisher.bot_setting_updated(bot.get_uid(), unpublishable_model)

        model = {**model}
        for key in unpublishable_keys:
            if key in old_bot_record:
                model[key] = convert_python_data(getattr(bot, key))

        return bot, model

    async def update_ip_whitelist(self, bot: TBotParam, ip_whitelist: list[str]) -> bool | tuple[Bot, dict[str, Any]]:
        bot = ServiceHelper.get_by_param(Bot, bot)
        if not bot:
            return False

        valid_ip_whitelist = self.filter_valid_ip_whitelist(ip_whitelist)

        bot.ip_whitelist = valid_ip_whitelist
        with DbSession.use(readonly=False) as db:
            db.update(bot)

        await BotPublisher.bot_setting_updated(bot.get_uid(), {"ip_whitelist": valid_ip_whitelist})

        return bot, {"ip_whitelist": valid_ip_whitelist}

    async def generate_new_api_token(self, bot: TBotParam) -> Bot | None:
        bot = ServiceHelper.get_by_param(Bot, bot)
        if not bot:
            return None

        bot.app_api_token = await self.generate_api_key()
        with DbSession.use(readonly=False) as db:
            db.update(bot)

        await BotPublisher.bot_setting_updated(bot.get_uid(), {"app_api_token": bot.app_api_token})

        return bot

    async def delete(self, bot: TBotParam) -> bool:
        bot = ServiceHelper.get_by_param(Bot, bot)
        if not bot:
            return False

        with DbSession.use(readonly=False) as db:
            db.delete(bot)

        await BotPublisher.bot_deleted(bot.get_uid())

        return True

    async def generate_api_key(self) -> str:
        api_key = f"sk-{generate_random_string(53)}"
        while True:
            is_existed = ServiceHelper.get_by(AppSetting, "setting_value", json_dumps(api_key))
            if not is_existed:
                break
            api_key = f"sk-{generate_random_string(53)}"
        return api_key

    def filter_valid_ip_whitelist(self, ip_whitelist: list[str]) -> list[str]:
        valid_ip_whitelist = []
        if ALLOWED_ALL_IPS in ip_whitelist:
            valid_ip_whitelist.append(ALLOWED_ALL_IPS)
        else:
            for ip in ip_whitelist:
                if not is_valid_ipv4_address_or_range(ip):
                    continue
                if ip.endswith("/24"):
                    ip = make_valid_ipv4_range(ip)
                valid_ip_whitelist.append(ip)
        return valid_ip_whitelist
