from typing import Any, Literal, Sequence
from ....core.domain import BaseDomainService
from ....core.domain.BaseDomainService import TMutableValidatorMap
from ....core.types.ParamTypes import TGlobalCardRelationshipTypeParam
from ....core.utils.Converter import convert_python_data
from ....helpers import InfraHelper
from ....publishers import AppSettingPublisher
from ...models import GlobalCardRelationshipType, WebhookSetting


class AppSettingService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "app_setting"

    def get_api_global_relationship_list(self) -> list[dict[str, Any]]:
        global_relationships = InfraHelper.get_all(GlobalCardRelationshipType)
        return [relationship.api_response() for relationship in global_relationships]

    def create_global_relationship(
        self, parent_name: str, child_name: str, description: str = ""
    ) -> GlobalCardRelationshipType:
        global_relationship = GlobalCardRelationshipType(
            parent_name=parent_name,
            child_name=child_name,
            description=description,
        )

        self.repo.global_card_relationship_type.insert(global_relationship)

        model = {"global_relationships": [global_relationship.api_response()]}
        AppSettingPublisher.global_relationship_created(model)

        return global_relationship

    def import_global_relationship(
        self, relationships: list[tuple[str, str, str | None]]
    ) -> list[GlobalCardRelationshipType]:
        global_relationships: list[GlobalCardRelationshipType] = []
        for parent_name, child_name, description in relationships:
            global_relationship = GlobalCardRelationshipType(
                parent_name=parent_name,
                child_name=child_name,
                description=description or "",
            )
            global_relationships.append(global_relationship)

        self.repo.global_card_relationship_type.insert(global_relationships)

        model = {"global_relationships": [gr.api_response() for gr in global_relationships]}
        AppSettingPublisher.global_relationship_created(model)

        return global_relationships

    def update_global_relationship(
        self, global_relationship: TGlobalCardRelationshipTypeParam | None, form: dict
    ) -> bool | tuple[GlobalCardRelationshipType, dict[str, Any]] | None:
        global_relationship = InfraHelper.get_by_id_like(GlobalCardRelationshipType, global_relationship)
        if not global_relationship:
            return None
        validators: TMutableValidatorMap = {
            "parent_name": "default",
            "child_name": "default",
            "description": "default",
        }

        old_record = self.apply_mutates(global_relationship, form, validators)
        if not old_record:
            return True

        self.repo.global_card_relationship_type.update(global_relationship)

        model = {}
        for key in form:
            if key not in validators or key not in old_record:
                continue
            model[key] = convert_python_data(getattr(global_relationship, key))

        AppSettingPublisher.global_relationship_updated(global_relationship.get_uid(), model)

        return global_relationship, model

    def delete_global_relationship(self, global_relationship: TGlobalCardRelationshipTypeParam | None) -> bool:
        global_relationship = InfraHelper.get_by_id_like(GlobalCardRelationshipType, global_relationship)
        if not global_relationship:
            return False

        self.repo.global_card_relationship_type.delete(global_relationship)

        AppSettingPublisher.global_relationship_deleted(global_relationship.get_uid())

        return True

    def delete_selected_global_relationships(self, relationships: Sequence[TGlobalCardRelationshipTypeParam]) -> bool:
        self.repo.global_card_relationship_type.delete(relationships)

        if isinstance(relationships, str):
            relationships = [relationships]
        uids = [InfraHelper.convert_uid(r) for r in relationships]
        AppSettingPublisher.selected_global_relationships_deleted(uids)

        return True

    def get_api_webhook_setting_list(self) -> list[dict[str, Any]]:
        webhook_settings = InfraHelper.get_all(WebhookSetting)
        return [setting.api_response() for setting in webhook_settings]

    def get_api_webhook_setting(self, webhook_setting_uid: str) -> dict[str, Any] | None:
        setting = InfraHelper.get_by_id_like(WebhookSetting, webhook_setting_uid)
        if not setting:
            return None
        return setting.api_response()

    def create_webhook_setting(self, name: str, url: str) -> WebhookSetting:
        webhook_setting = WebhookSetting(
            name=name,
            url=url.strip(),
        )

        self.repo.webhook_setting.insert(webhook_setting)

        AppSettingPublisher.webhook_setting_created(webhook_setting)

        return webhook_setting

    def update_webhook_setting(
        self, webhook_setting_uid: str, name: str | None = None, url: str | None = None
    ) -> WebhookSetting | Literal[True] | None:
        setting = InfraHelper.get_by_id_like(WebhookSetting, webhook_setting_uid)
        if not setting:
            return None

        if name:
            setting.name = name
        if url:
            setting.url = url.strip()

        model = setting.changes_dict

        if not setting.has_changes():
            return True

        self.repo.webhook_setting.update(setting)

        AppSettingPublisher.webhook_setting_updated(setting.get_uid(), model)

        return setting

    def delete_webhook_setting(self, webhook_setting_uid: str) -> bool:
        setting = InfraHelper.get_by_id_like(WebhookSetting, webhook_setting_uid)
        if not setting:
            return False

        self.repo.webhook_setting.delete(setting)

        AppSettingPublisher.webhook_setting_deleted(setting.get_uid())

        return True

    def delete_selected_webhook_settings(self, webhook_setting_uids: Sequence[str]) -> bool:
        self.repo.webhook_setting.delete(webhook_setting_uids)

        if isinstance(webhook_setting_uids, str):
            webhook_setting_uids = [webhook_setting_uids]
        uids = [InfraHelper.convert_uid(r) for r in webhook_setting_uids]
        AppSettingPublisher.selected_webhook_settings_deleted(uids)

        return True
