from typing import Any, Literal, overload
from core.db import DbSession, SqlBuilder
from core.service import BaseService
from core.storage import FileModel
from helpers import ServiceHelper
from models import InternalBot, Project, ProjectAssignedInternalBot
from models.BaseBotModel import BotPlatform, BotPlatformRunningType
from models.InternalBot import InternalBotType
from publishers import InternalBotPublisher, ProjectPublisher
from .Types import TInternalBotParam


class InternalBotService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "internal_bot"

    async def get_by_uid(self, uid: str) -> InternalBot | None:
        return ServiceHelper.get_by_param(InternalBot, uid)

    @overload
    async def get_list(self, as_api: Literal[False], is_setting: bool) -> list[InternalBot]: ...
    @overload
    async def get_list(self, as_api: Literal[True], is_setting: bool) -> list[dict[str, Any]]: ...
    async def get_list(self, as_api: bool, is_setting: bool) -> list[InternalBot] | list[dict[str, Any]]:
        internal_bots = ServiceHelper.get_all(InternalBot)
        if as_api:
            return [internal_bot.api_response(is_setting=is_setting) for internal_bot in internal_bots]
        return internal_bots

    async def get_list_by_default(self) -> list[InternalBot]:
        internal_bots = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(InternalBot).where(InternalBot.is_default == True)  # noqa: E712
            )
            internal_bots = result.all()
        return internal_bots

    async def create(
        self,
        bot_type: InternalBotType,
        display_name: str,
        platform: BotPlatform,
        platform_running_type: BotPlatformRunningType,
        api_url: str = "",
        value: str = "",
        api_key: str = "",
        avatar: FileModel | None = None,
        is_default: bool = False,
    ) -> InternalBot:
        internal_bot = InternalBot(
            bot_type=bot_type,
            display_name=display_name,
            platform=platform,
            platform_running_type=platform_running_type,
            api_url=api_url,
            api_key=api_key,
            value=value,
            is_default=is_default,
            avatar=avatar,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(internal_bot)

        await InternalBotPublisher.created(internal_bot)

        return internal_bot

    async def update(self, internal_bot: TInternalBotParam, form: dict) -> InternalBot | Literal[True] | None:
        internal_bot = ServiceHelper.get_by_param(InternalBot, internal_bot)
        if not internal_bot:
            return None

        mutable_keys = [
            "display_name",
            "platform",
            "platform_running_type",
            "api_url",
            "api_key",
            "value",
            "avatar",
        ]

        updated_keys = []

        for key in mutable_keys:
            if key not in form or not hasattr(internal_bot, key):
                continue
            old_value = getattr(internal_bot, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            setattr(internal_bot, key, new_value)
            updated_keys.append(key)

        available_running_types = InternalBot.AVAILABLE_RUNNING_TYPES_BY_PLATFORM[internal_bot.platform]
        if internal_bot.platform_running_type not in available_running_types:
            internal_bot.platform_running_type = available_running_types[0]
            updated_keys.append("platform_running_type")

        if "delete_avatar" in form and form["delete_avatar"]:
            internal_bot.avatar = None
            updated_keys.append("avatar")

        if not updated_keys:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(internal_bot)

        await InternalBotPublisher.updated(internal_bot)

        return internal_bot

    async def change_default(self, internal_bot: TInternalBotParam) -> InternalBot | Literal[True] | None:
        internal_bot = ServiceHelper.get_by_param(InternalBot, internal_bot)
        if not internal_bot:
            return None

        if internal_bot.is_default:
            return True

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(InternalBot)
                .values({InternalBot.column("is_default"): False})
                .where(
                    (InternalBot.column("bot_type") == internal_bot.bot_type) & (InternalBot.is_default == True)  # noqa: E712
                )
            )

            internal_bot.is_default = True
            db.update(internal_bot)

        await InternalBotPublisher.default_changed(internal_bot)

        return internal_bot

    async def delete(self, internal_bot: TInternalBotParam) -> bool:
        internal_bot = ServiceHelper.get_by_param(InternalBot, internal_bot)
        if not internal_bot or internal_bot.is_default:
            return False

        default_internal_bot_id = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.column(InternalBot.id).where(
                    (InternalBot.column("bot_type") == internal_bot.bot_type) & (InternalBot.is_default == True)  # noqa: E712
                )
            )
            default_internal_bot_id = result.first()

        if not default_internal_bot_id:
            display_name = internal_bot.bot_type.value.replace("_", " ").title()
            new_default_internal_bot = await self.create(
                bot_type=internal_bot.bot_type,
                display_name=display_name,
                platform=BotPlatform.Default,
                platform_running_type=BotPlatformRunningType.Default,
                is_default=True,
            )
            default_internal_bot_id = new_default_internal_bot.id

        projects = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(Project)
                .join(
                    ProjectAssignedInternalBot,
                    ProjectAssignedInternalBot.column("project_id") == Project.column("id"),
                )
                .where(ProjectAssignedInternalBot.column("internal_bot_id") == internal_bot.id)
            )
            projects = result.all()

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(ProjectAssignedInternalBot)
                .values({ProjectAssignedInternalBot.column("internal_bot_id"): default_internal_bot_id})
                .where(ProjectAssignedInternalBot.column("internal_bot_id") == internal_bot.id)
            )
            db.delete(internal_bot)

        for project in projects:
            await ProjectPublisher.internal_bot_changed(project, default_internal_bot_id)
        await InternalBotPublisher.deleted(internal_bot)

        return True
