from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.utils.decorators import staticclass


@staticclass
class MetadataPublisher(BaseSocketPublisher):
    @staticmethod
    async def updated_metadata(
        topic: SocketTopic,
        topic_uid: str,
        key: str,
        value: str,
        old_key: str | None = None,
    ):
        model = {"key": key, "value": value, "old_key": old_key}
        publish_model = SocketPublishModel(
            topic=topic,
            topic_id=topic_uid,
            event=f"metadata:updated:{topic_uid}",
            data_keys=list(model.keys()),
        )

        await MetadataPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def deleted_metadata(topic: SocketTopic, topic_uid: str, keys: list[str]):
        model = {"keys": keys}
        publish_model = SocketPublishModel(
            topic=topic,
            topic_id=topic_uid,
            event=f"metadata:deleted:{topic_uid}",
            data_keys=list(model.keys()),
        )

        await MetadataPublisher.put_dispather(model, publish_model)
