from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.routing.SocketTopic import GLOBAL_TOPIC_ID
from ..core.utils.decorators import staticclass
from ..models import InternalBot


@staticclass
class InternalBotPublisher(BaseSocketPublisher):
    @staticmethod
    async def created(setting: InternalBot):
        model = {"uid": setting.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="internal-bot:created",
            data_keys=list(model.keys()),
        )

        await InternalBotPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def updated(setting: InternalBot):
        model = {"uid": setting.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="internal-bot:updated",
            data_keys=list(model.keys()),
        )

        await InternalBotPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def default_changed(setting: InternalBot):
        model = {"bot_type": setting.bot_type.value}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:internal-bot:default-changed:{setting.get_uid()}",
            data_keys=list(model.keys()),
        )

        await InternalBotPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def deleted(setting: InternalBot):
        model = {"uid": setting.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="internal-bot:deleted",
            data_keys=list(model.keys()),
        )

        await InternalBotPublisher.put_dispather(model, publish_model)
