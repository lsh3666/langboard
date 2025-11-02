from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.utils.decorators import staticclass
from ..models import Project, ProjectLabel


@staticclass
class ProjectLabelPublisher(BaseSocketPublisher):
    @staticmethod
    async def created(project: Project, label: ProjectLabel):
        model = {"label": label.api_response()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:label:created:{project.get_uid()}",
            data_keys="label",
        )

        await ProjectLabelPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def updated(project: Project, label: ProjectLabel, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:label:details:changed:{label.get_uid()}",
            data_keys=list(model.keys()),
        )

        await ProjectLabelPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def order_changed(project: Project, label: ProjectLabel):
        topic_id = project.get_uid()
        model = {"uid": label.get_uid(), "order": label.order}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:label:order:changed:{topic_id}",
            data_keys=["uid", "order"],
        )

        await ProjectLabelPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def deleted(project: Project, label: ProjectLabel):
        topic_id = project.get_uid()
        model = {"uid": label.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:label:deleted:{topic_id}",
            data_keys="uid",
        )

        await ProjectLabelPublisher.put_dispather(model, publish_model)
