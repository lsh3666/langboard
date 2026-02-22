from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import GLOBAL_TOPIC_ID, SocketTopic
from ..core.utils.decorators import staticclass
from ..domain.models import AppSetting, McpToolGroup


@staticclass
class AppSettingPublisher(BaseSocketPublisher):
    @staticmethod
    def setting_created(setting: AppSetting):
        model = {"uid": setting.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="settings:created",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    def setting_updated(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:updated:{uid}",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    def setting_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:deleted:{uid}",
        )

        AppSettingPublisher.put_dispather({}, publish_model)

    @staticmethod
    def selected_setting_deleted(uids: list[str]):
        model = {"uids": uids}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="settings:deleted",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    def selected_users_deleted(uids: list[str]):
        model = {"uids": uids}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="user:deleted",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    def global_relationship_created(model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="global-relationship:created",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    def global_relationship_updated(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"global-relationship:updated:{uid}",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    def global_relationship_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"global-relationship:deleted:{uid}",
        )

        AppSettingPublisher.put_dispather({}, publish_model)

    @staticmethod
    def selected_global_relationships_deleted(uids: list[str]):
        model = {"uids": uids}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="global-relationship:deleted",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    def mcp_tool_group_created(tool_group: McpToolGroup):
        if tool_group.user_id:
            return

        model = {"tool_group": tool_group.api_response()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="mcp-tool-group:created",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    def mcp_tool_group_updated(tool_group: McpToolGroup, model: dict[str, Any]):
        if tool_group.user_id:
            return

        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"mcp-tool-group:updated:{tool_group.get_uid()}",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)

    @staticmethod
    def mcp_tool_group_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"mcp-tool-group:deleted:{uid}",
        )

        AppSettingPublisher.put_dispather({}, publish_model)

    @staticmethod
    def selected_mcp_tool_groups_deleted(uids: list[str]):
        model = {"uids": uids}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="mcp-tool-group:deleted",
            data_keys=list(model.keys()),
        )

        AppSettingPublisher.put_dispather(model, publish_model)
