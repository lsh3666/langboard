from typing import Any
from ....core.domain import BaseDomainService
from ....core.domain.BaseDomainService import TMutableValidatorMap
from ....core.storage import FileModel
from ....core.types.ParamTypes import TBotParam
from ....core.utils.Converter import convert_python_data
from ....core.utils.IpAddress import is_valid_ipv4_address_or_range, make_valid_ipv4_range
from ....core.utils.String import generate_random_string
from ....domain.models import Bot
from ....domain.models.Bot import ALLOWED_ALL_IPS
from ....helpers import InfraHelper
from ....publishers import BotPublisher
from ....tasks.bots import BotDefaultTask
from ...models.BaseBotModel import BotPlatform, BotPlatformRunningType


class BotService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "bot"

    async def get_by_id_like(self, bot: TBotParam | None) -> Bot | None:
        bot = InfraHelper.get_by_id_like(Bot, bot)
        return bot

    async def get_api_list(self, is_setting: bool = False) -> list[dict[str, Any]]:
        bots = InfraHelper.get_all(Bot)
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
        existing_bot = InfraHelper.get_by(Bot, "bot_uname", bot_uname)
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

        self.repo.bot.insert(bot)

        await BotPublisher.bot_created(bot)
        BotDefaultTask.bot_created(bot)

        return bot

    async def update(self, bot: TBotParam | None, form: dict) -> bool | tuple[Bot, dict[str, Any]] | None:
        bot = InfraHelper.get_by_id_like(Bot, bot)
        if not bot:
            return None
        validators: TMutableValidatorMap = {
            "name": "default",
            "bot_uname": "default",
            "avatar": "default",
            "api_url": "default",
            "platform": "default",
            "platform_running_type": "default",
            "api_key": "default",
            "value": "default",
        }
        unpublishable_keys = [
            "api_url",
            "platform",
            "platform_running_type",
            "api_key",
            "value",
        ]

        if "platform" in form and form["platform"] != bot.platform:
            if form["platform"] not in Bot.ALLOWED_ALL_IPS_BY_PLATFORMS:
                form.pop("platform", None)
                form.pop("platform_running_type", None)
            else:
                available_running_types = Bot.AVAILABLE_RUNNING_TYPES_BY_PLATFORM[form["platform"]]
                platform_running_type = form.get("platform_running_type", available_running_types[0])
                if platform_running_type not in available_running_types:
                    form["platform_running_type"] = available_running_types[0]

        if "platform_running_type" in form:
            platform = form.get("platform", bot.platform)
            if platform not in Bot.AVAILABLE_RUNNING_TYPES_BY_PLATFORM:
                form.pop("platform_running_type", None)
            else:
                available_running_types = Bot.AVAILABLE_RUNNING_TYPES_BY_PLATFORM[platform]
                if form["platform_running_type"] not in available_running_types:
                    form.pop("platform_running_type", None)

        if "bot_uname" in form:
            existing_bot = InfraHelper.get_by(Bot, "bot_uname", form["bot_uname"])
            if existing_bot:
                return False

        old_record = self.apply_mutates(bot, form, validators)

        if "delete_avatar" in form and form["delete_avatar"]:
            old_record["avatar"] = convert_python_data(bot.avatar)
            bot.avatar = None

        if not old_record:
            return True

        self.repo.bot.update(bot)

        model: dict[str, Any] = {}
        unpublishable_model: dict[str, Any] = {}
        for key in form:
            if key in unpublishable_keys:
                if key in old_record:
                    unpublishable_model[key] = convert_python_data(getattr(bot, key))
                continue

            if key not in validators or key not in old_record:
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
            if key in old_record:
                model[key] = convert_python_data(getattr(bot, key))

        return bot, model

    async def update_ip_whitelist(
        self, bot: TBotParam | None, ip_whitelist: list[str]
    ) -> bool | tuple[Bot, dict[str, Any]]:
        bot = InfraHelper.get_by_id_like(Bot, bot)
        if not bot:
            return False

        valid_ip_whitelist = self.filter_valid_ip_whitelist(ip_whitelist)

        bot.ip_whitelist = valid_ip_whitelist
        self.repo.bot.update(bot)

        await BotPublisher.bot_setting_updated(bot.get_uid(), {"ip_whitelist": valid_ip_whitelist})

        return bot, {"ip_whitelist": valid_ip_whitelist}

    async def generate_new_api_token(self, bot: TBotParam | None) -> Bot | None:
        bot = InfraHelper.get_by_id_like(Bot, bot)
        if not bot:
            return None

        bot.app_api_token = await self.generate_api_key()
        self.repo.bot.update(bot)

        await BotPublisher.bot_setting_updated(bot.get_uid(), {"app_api_token": bot.app_api_token})

        return bot

    async def delete(self, bot: TBotParam | None) -> bool:
        bot = InfraHelper.get_by_id_like(Bot, bot)
        if not bot:
            return False

        self.repo.bot.delete(bot)

        await BotPublisher.bot_deleted(bot.get_uid())

        return True

    async def generate_api_key(self) -> str:
        api_key = f"sk-{generate_random_string(53)}"
        while True:
            is_existed = InfraHelper.get_by(Bot, "api_key", api_key)
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
