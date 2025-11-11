from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.types import SnowflakeID
from ..core.utils.decorators import staticclass
from ..models import User


@staticclass
class UserPublisher(BaseSocketPublisher):
    @staticmethod
    async def updated(user: User, model: dict[str, Any]):
        topic_id = user.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.User,
            topic_id=topic_id,
            event="user:updated",
            data_keys=list(model.keys()),
        )

        await UserPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def deactivated(user: User):
        topic_id = user.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.UserPrivate,
            topic_id=topic_id,
            event=f"user:deactivated:{topic_id}",
            data_keys=[],
        )

        await UserPublisher.put_dispather({}, publish_model)

    @staticmethod
    async def deleted(user: User | SnowflakeID):
        if isinstance(user, User):
            topic_id = user.get_uid()
        else:
            topic_id = user.to_short_code()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.UserPrivate,
                topic_id=topic_id,
                event=f"user:deleted:{topic_id}",
                data_keys=[],
            ),
            SocketPublishModel(
                topic=SocketTopic.User,
                topic_id=topic_id,
                event=f"user:deleted:{topic_id}",
                data_keys=[],
            ),
        ]

        await UserPublisher.put_dispather({}, publish_models)
