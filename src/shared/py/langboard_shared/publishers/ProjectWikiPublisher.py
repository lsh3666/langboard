from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.utils.decorators import staticclass
from ..domain.models import Bot, Project, ProjectWiki, User


@staticclass
class ProjectWikiPublisher(BaseSocketPublisher):
    @staticmethod
    async def created(project: Project, wiki: ProjectWiki):
        model = {"wiki": {**wiki.api_response(), "assigned_members": []}}
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:created:{project.get_uid()}",
            data_keys="wiki",
        )

        await ProjectWikiPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def updated(project: Project, wiki: ProjectWiki, model: dict[str, Any]):
        wiki_uid = wiki.get_uid()
        topic = SocketTopic.BoardWiki if wiki.is_public else SocketTopic.BoardWikiPrivate
        topic_id = project.get_uid() if wiki.is_public else wiki_uid
        publish_model = SocketPublishModel(
            topic=topic,
            topic_id=topic_id,
            event=f"board:wiki:details:changed:{wiki_uid}",
            data_keys=list(model.keys()),
        )

        await ProjectWikiPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def publicity_changed(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
        assigned_users = [user_or_bot] if not wiki.is_public and isinstance(user_or_bot, User) else []

        model = {
            "wiki": {
                **wiki.api_response(),
                "assigned_members": [assigned_user.api_response() for assigned_user in assigned_users],
            },
        }

        wiki_uid = wiki.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:public:changed:{wiki_uid}",
            data_keys="wiki",
        )

        await ProjectWikiPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def assignees_updated(project: Project, wiki: ProjectWiki, users: list[User]):
        model = {
            "assigned_members": [user.api_response() for user in users],
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:assignees:updated:{wiki.get_uid()}",
            data_keys=list(model.keys()),
        )

        await ProjectWikiPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def order_changed(project: Project, wiki: ProjectWiki):
        model = {
            "uid": wiki.get_uid(),
            "order": wiki.order,
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:order:changed:{project.get_uid()}",
            data_keys=["uid", "order"],
        )

        await ProjectWikiPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def deleted(project: Project, wiki: ProjectWiki):
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardWiki,
            topic_id=project.get_uid(),
            event=f"board:wiki:deleted:{wiki.get_uid()}",
        )

        await ProjectWikiPublisher.put_dispather({}, publish_model)
