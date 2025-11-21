from json import dumps as json_dumps
from typing import Any, Literal, Sequence
from ....core.domain import BaseDomainService
from ....core.domain.BaseDomainService import TMutableValidatorMap
from ....core.types.ParamTypes import TGlobalCardRelationshipTypeParam, TSettingParam
from ....core.utils.Converter import convert_python_data
from ....core.utils.String import generate_random_string
from ....domain.models import AppSetting, GlobalCardRelationshipType
from ....domain.models.AppSetting import AppSettingType
from ....helpers import InfraHelper
from ....publishers import AppSettingPublisher


class AppSettingService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "app_setting"

    async def get_by_id_like(self, setting: TSettingParam | None) -> AppSetting | None:
        setting = InfraHelper.get_by_id_like(AppSetting, setting)
        return setting

    async def get_api_list_by_type(self, setting_type: AppSettingType) -> list[dict[str, Any]]:
        settings = InfraHelper.get_all_by(AppSetting, "setting_type", setting_type)
        return [setting.api_response() for setting in settings]

    async def get_api_list(self) -> list[dict[str, Any]]:
        settings = InfraHelper.get_all(AppSetting)
        return [setting.api_response() for setting in settings]

    async def get_api_global_relationship_list(self) -> list[dict[str, Any]]:
        global_relationships = InfraHelper.get_all(GlobalCardRelationshipType)
        return [relationship.api_response() for relationship in global_relationships]

    async def generate_api_key(self) -> str:
        api_key = f"sk-{generate_random_string(53)}"
        while True:
            is_existed = InfraHelper.get_by(AppSetting, "setting_value", json_dumps(api_key))
            if not is_existed:
                break
            api_key = f"sk-{generate_random_string(53)}"
        return api_key

    async def create(self, setting_type: AppSettingType, setting_name: str, setting_value: Any) -> AppSetting:
        setting = AppSetting(setting_type=setting_type, setting_name=setting_name)
        setting.set_value(setting_value)

        self.repo.app_setting.insert(setting)

        await AppSettingPublisher.setting_created(setting)

        return setting

    async def update(
        self,
        setting: TSettingParam | None,
        setting_name: str | None = None,
        setting_value: Any | None = None,
    ) -> AppSetting | Literal[True] | None:
        setting = InfraHelper.get_by_id_like(AppSetting, setting)
        if not setting:
            return None

        if setting_name:
            setting.setting_name = setting_name
        if setting_value and not setting.is_immutable_type():
            setting.set_value(setting_value)

        model = setting.changes_dict

        if not setting.has_changes():
            return True

        self.repo.app_setting.update(setting)

        await AppSettingPublisher.setting_updated(setting.get_uid(), model)

        return setting

    async def delete(self, setting: TSettingParam | None) -> bool:
        setting = InfraHelper.get_by_id_like(AppSetting, setting)
        if not setting:
            return False

        self.repo.app_setting.delete(setting)

        await AppSettingPublisher.setting_deleted(setting.get_uid())

        return True

    async def delete_selected(self, settings: Sequence[TSettingParam]) -> bool:
        self.repo.app_setting.delete(settings)

        uids = [InfraHelper.convert_uid(s) for s in settings]
        await AppSettingPublisher.selected_setting_deleted(uids)

        return True

    async def create_global_relationship(
        self, parent_name: str, child_name: str, description: str = ""
    ) -> GlobalCardRelationshipType:
        global_relationship = GlobalCardRelationshipType(
            parent_name=parent_name,
            child_name=child_name,
            description=description,
        )

        self.repo.global_card_relationship_type.insert(global_relationship)

        model = {"global_relationships": [global_relationship.api_response()]}
        await AppSettingPublisher.global_relationship_created(model)

        return global_relationship

    async def import_global_relationship(
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
        await AppSettingPublisher.global_relationship_created(model)

        return global_relationships

    async def update_global_relationship(
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

        await AppSettingPublisher.global_relationship_updated(global_relationship.get_uid(), model)

        return global_relationship, model

    async def delete_global_relationship(self, global_relationship: TGlobalCardRelationshipTypeParam | None) -> bool:
        global_relationship = InfraHelper.get_by_id_like(GlobalCardRelationshipType, global_relationship)
        if not global_relationship:
            return False

        self.repo.global_card_relationship_type.delete(global_relationship)

        await AppSettingPublisher.global_relationship_deleted(global_relationship.get_uid())

        return True

    async def delete_selected_global_relationships(
        self, relationships: Sequence[TGlobalCardRelationshipTypeParam]
    ) -> bool:
        self.repo.global_card_relationship_type.delete(relationships)

        uids = [InfraHelper.convert_uid(r) for r in relationships]
        await AppSettingPublisher.selected_global_relationships_deleted(uids)

        return True
