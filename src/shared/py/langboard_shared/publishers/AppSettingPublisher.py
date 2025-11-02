from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import GLOBAL_TOPIC_ID, SocketTopic
from ..core.utils.decorators import staticclass
from ..models import AppSetting


@staticclass
class AppSettingPublisher(BaseSocketPublisher):
    @staticmethod
    async def setting_created(setting: AppSetting):
        model = {"uid": setting.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="settings:created",
            data_keys=list(model.keys()),
        )

        await AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def setting_updated(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:updated:{uid}",
            data_keys=list(model.keys()),
        )

        await AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def setting_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:deleted:{uid}",
        )

        await AppSettingPublisher.put_dispather({}, publish_model)

    @staticmethod
    async def selected_setting_deleted(uids: list[str]):
        model = {"uids": uids}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="settings:deleted",
            data_keys=list(model.keys()),
        )

        await AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def selected_users_deleted(uids: list[str]):
        model = {"uids": uids}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="user:deleted",
            data_keys=list(model.keys()),
        )

        await AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def global_relationship_created(model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="global-relationship:created",
            data_keys=list(model.keys()),
        )

        await AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def global_relationship_updated(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"global-relationship:updated:{uid}",
            data_keys=list(model.keys()),
        )

        await AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def global_relationship_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"global-relationship:deleted:{uid}",
        )

        await AppSettingPublisher.put_dispather({}, publish_model)

    @staticmethod
    async def selected_global_relationships_deleted(uids: list[str]):
        model = {"uids": uids}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="global-relationship:deleted",
            data_keys=list(model.keys()),
        )

        await AppSettingPublisher.put_dispather(model, publish_model)
