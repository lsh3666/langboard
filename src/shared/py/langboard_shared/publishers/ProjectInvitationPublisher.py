from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.utils.decorators import staticclass
from ..models import Project, User, UserNotification


@staticclass
class ProjectInvitationPublisher(BaseSocketPublisher):
    @staticmethod
    async def accepted(project: Project, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:assigned-users:updated:{topic_id}",
            data_keys=list(model.keys()),
        )
        await ProjectInvitationPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def notification_deleted(user: User, notification: UserNotification):
        model = {"notification_uid": notification.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.UserPrivate,
            topic_id=user.get_uid(),
            event="user:notification:deleted",
            data_keys="notification_uid",
        )
        await ProjectInvitationPublisher.put_dispather(model, publish_model)
