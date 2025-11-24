from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.types import SnowflakeID
from ..core.utils.decorators import staticclass
from ..domain.models import ChatTemplate, Project, ProjectAssignedInternalBot, User
from ..domain.models.InternalBot import InternalBotType


@staticclass
class ProjectPublisher(BaseSocketPublisher):
    @staticmethod
    async def updated(project: Project, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:details:changed:{topic_id}",
            data_keys=list(model.keys()),
        )

        await ProjectPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def assigned_users_updated(project: Project, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_models: list[SocketPublishModel] = []
        for topic in [SocketTopic.Board, SocketTopic.Dashboard, SocketTopic.BoardWiki]:
            event_prefix = "board" if topic != SocketTopic.Dashboard else "dashboard:project"
            data_keys = "assigned_members" if topic != SocketTopic.Board else ["assigned_members", "invited_members"]
            publish_models.append(
                SocketPublishModel(
                    topic=topic,
                    topic_id=topic_id,
                    event=f"{event_prefix}:assigned-users:updated:{topic_id}",
                    data_keys=data_keys,
                )
            )

        await ProjectPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def user_roles_updated(project: Project, target_user: User, roles: list[str]):
        topic_id = project.get_uid()
        model = {"user_uid": target_user.get_uid(), "roles": roles}
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:roles:user:updated:{topic_id}",
                data_keys=["user_uid", "roles"],
            ),
            SocketPublishModel(
                topic=SocketTopic.UserPrivate,
                topic_id=target_user.get_uid(),
                event="user:project-roles:updated",
                data_keys="roles",
                custom_data={"project_uid": topic_id},
            ),
        ]

        await ProjectPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def deleted(project: Project):
        topic_id = project.get_uid()
        publish_models: list[SocketPublishModel] = []
        for topic in [SocketTopic.Board, SocketTopic.Dashboard]:
            event_prefix = "board" if topic != SocketTopic.Dashboard else "dashboard:project"
            publish_models.append(
                SocketPublishModel(
                    topic=topic,
                    topic_id=topic_id,
                    event=f"{event_prefix}:deleted:{topic_id}",
                )
            )

        await ProjectPublisher.put_dispather({}, publish_models)

    @staticmethod
    async def chat_template_created(project: Project, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:chat:template:created:{topic_id}",
            data_keys=list(model.keys()),
        )

        await ProjectPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def chat_template_updated(project: Project, template: ChatTemplate, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:chat:template:updated:{template.get_uid()}",
            data_keys=list(model.keys()),
        )

        await ProjectPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def chat_template_deleted(project: Project, template_uid: str):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:chat:template:deleted:{template_uid}",
        )

        await ProjectPublisher.put_dispather({}, publish_model)

    @staticmethod
    async def internal_bot_changed(project: Project, internal_bot_id: SnowflakeID):
        topic_id = project.get_uid()
        model = {"internal_bot_uid": internal_bot_id.to_short_code()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:assigned-internal-bot:changed:{topic_id}",
            data_keys=list(model.keys()),
        )

        await ProjectPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def internal_bot_settings_changed(
        project: Project, bot_type: InternalBotType, assigned_internal_bot: ProjectAssignedInternalBot
    ):
        topic_id = project.get_uid()
        model = {"bot_type": bot_type.value, **assigned_internal_bot.api_response()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardSettings,
            topic_id=topic_id,
            event=f"board:assigned-internal-bot:settings:changed:{topic_id}",
            data_keys=list(model.keys()),
        )

        await ProjectPublisher.put_dispather(model, publish_model)
