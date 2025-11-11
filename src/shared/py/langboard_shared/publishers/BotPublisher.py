from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import GLOBAL_TOPIC_ID, SocketTopic
from ..core.utils.decorators import staticclass
from ..models import Bot


@staticclass
class BotPublisher(BaseSocketPublisher):
    @staticmethod
    async def bot_created(bot: Bot):
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
                topic_id=GLOBAL_TOPIC_ID,
                event="settings:bot:created",
                data_keys="setting_bot",
            ),
        ]

        await BotPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def bot_updated(uid: str, model: dict[str, Any]):
        if not model:
            return

        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"bot:updated:{uid}",
            data_keys=list(model.keys()),
        )

        await BotPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def bot_setting_updated(uid: str, model: dict[str, Any]):
        if not model:
            return

        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:bot:updated:{uid}",
            data_keys=list(model.keys()),
        )

        await BotPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def bot_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"bot:deleted:{uid}",
        )

        await BotPublisher.put_dispather({}, publish_model)
