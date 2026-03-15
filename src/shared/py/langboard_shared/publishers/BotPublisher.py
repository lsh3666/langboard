from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import GLOBAL_TOPIC_ID, SettingSocketTopicID, SocketTopic
from ..core.utils.decorators import staticclass
from ..domain.models import Bot, BotDefaultScopeBranch


@staticclass
class BotPublisher(BaseSocketPublisher):
    @staticmethod
    def bot_created(bot: Bot):
        model = {
            "bot": bot.api_response(),
            "setting_bot": bot.api_response(is_setting=True),
        }
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Global,
                topic_id=GLOBAL_TOPIC_ID,
                event="bot:created",
                data_keys="bot",
            ),
            SocketPublishModel(
                topic=SocketTopic.AppSettings,
                topic_id=SettingSocketTopicID.Bot.value,
                event="settings:bot:created",
                data_keys="setting_bot",
            ),
        ]

        BotPublisher.put_dispather(model, publish_models)

    @staticmethod
    def bot_updated(uid: str, model: dict[str, Any]):
        if not model:
            return

        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"bot:updated:{uid}",
            data_keys=list(model.keys()),
        )

        BotPublisher.put_dispather(model, publish_model)

    @staticmethod
    def bot_setting_updated(uid: str, model: dict[str, Any]):
        if not model:
            return

        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=SettingSocketTopicID.Bot.value,
            event=f"settings:bot:updated:{uid}",
            data_keys=list(model.keys()),
        )

        BotPublisher.put_dispather(model, publish_model)

    @staticmethod
    def bot_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"bot:deleted:{uid}",
        )

        BotPublisher.put_dispather({}, publish_model)

    @staticmethod
    def default_scope_branch_created(default_scope_branch: BotDefaultScopeBranch):
        model = {
            "default_scope_branch": default_scope_branch.api_response({}),
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="bot:default-scope-branch:created",
            data_keys="default_scope_branch",
        )

        BotPublisher.put_dispather(model, publish_model)

    @staticmethod
    def default_scope_branch_updated(uid: str, model: dict[str, Any]):
        if not model:
            return

        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"bot:default-scope-branch:updated:{uid}",
            data_keys=list(model.keys()),
        )

        BotPublisher.put_dispather(model, publish_model)

    @staticmethod
    def default_scope_branch_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"bot:default-scope-branch:deleted:{uid}",
        )

        BotPublisher.put_dispather({}, publish_model)
