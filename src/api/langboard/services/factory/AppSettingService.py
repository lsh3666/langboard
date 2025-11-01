from json import dumps as json_dumps
from typing import Any, Literal, overload
from core.db import DbSession, SqlBuilder
from core.service import BaseService
from core.types import SnowflakeID
from core.utils.Converter import convert_python_data
from core.utils.String import generate_random_string
from helpers import ServiceHelper
from models import AppSetting, GlobalCardRelationshipType
from models.AppSetting import AppSettingType
from publishers import AppSettingPublisher
from .Types import TGlobalCardRelationshipTypeParam, TSettingParam


class AppSettingService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "app_setting"

    @overload
    async def get_by_uid(self, setting_uid: str, as_api: Literal[False]) -> AppSetting | None: ...
    @overload
    async def get_by_uid(self, setting_uid: str, as_api: Literal[True]) -> dict[str, Any] | None: ...
    async def get_by_uid(self, setting_uid: str, as_api: bool) -> AppSetting | dict[str, Any] | None:
        setting = ServiceHelper.get_by(AppSetting, "id", SnowflakeID.from_short_code(setting_uid))
        if not setting:
            return None
        if as_api:
            return setting.api_response()
        return setting

    @overload
    async def get_all_by_type(self, setting_type: AppSettingType, as_api: Literal[False]) -> list[AppSetting]: ...
    @overload
    async def get_all_by_type(self, setting_type: AppSettingType, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all_by_type(
        self, setting_type: AppSettingType, as_api: bool
    ) -> list[AppSetting] | list[dict[str, Any]]:
        settings = ServiceHelper.get_all_by(AppSetting, "setting_type", setting_type)
        if as_api:
            return [setting.api_response() for setting in settings]
        return settings

    @overload
    async def get_all(self, as_api: Literal[False]) -> list[AppSetting]: ...
    @overload
    async def get_all(self, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all(self, as_api: bool) -> list[AppSetting] | list[dict[str, Any]]:
        settings = ServiceHelper.get_all(AppSetting)
        if as_api:
            return [setting.api_response() for setting in settings]
        return settings

    @overload
    async def get_global_relationships(self, as_api: Literal[False]) -> list[GlobalCardRelationshipType]: ...
    @overload
    async def get_global_relationships(self, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_global_relationships(self, as_api: bool) -> list[GlobalCardRelationshipType] | list[dict[str, Any]]:
        global_relationships = ServiceHelper.get_all(GlobalCardRelationshipType)
        if as_api:
            return [relationship.api_response() for relationship in global_relationships]
        return global_relationships

    async def generate_api_key(self) -> str:
        api_key = f"sk-{generate_random_string(53)}"
        while True:
            is_existed = ServiceHelper.get_by(AppSetting, "setting_value", json_dumps(api_key))
            if not is_existed:
                break
            api_key = f"sk-{generate_random_string(53)}"
        return api_key

    async def create(self, setting_type: AppSettingType, setting_name: str, setting_value: Any) -> AppSetting:
        setting = AppSetting(setting_type=setting_type, setting_name=setting_name)
        setting.set_value(setting_value)

        with DbSession.use(readonly=False) as db:
            db.insert(setting)

        await AppSettingPublisher.setting_created(setting)

        return setting

    async def update(
        self,
        setting: TSettingParam,
        setting_name: str | None = None,
        setting_value: Any | None = None,
    ) -> AppSetting | Literal[True] | None:
        setting = ServiceHelper.get_by_param(AppSetting, setting)
        if not setting:
            return None

        if setting_name:
            setting.setting_name = setting_name
        if setting_value and not setting.is_immutable_type():
            setting.set_value(setting_value)

        model = setting.changes_dict

        if not setting.has_changes():
            return True

        with DbSession.use(readonly=False) as db:
            db.update(setting)

        await AppSettingPublisher.setting_updated(setting.get_uid(), model)

        return setting

    async def delete(self, setting: TSettingParam) -> bool:
        setting = ServiceHelper.get_by_param(AppSetting, setting)
        if not setting:
            return False

        with DbSession.use(readonly=False) as db:
            db.delete(setting)

        await AppSettingPublisher.setting_deleted(setting.get_uid())

        return True

    async def delete_selected(self, uids: list[str]) -> bool:
        ids: list[SnowflakeID] = [SnowflakeID.from_short_code(uid) for uid in uids]

        with DbSession.use(readonly=False) as db:
            db.exec(SqlBuilder.delete.table(AppSetting).where(AppSetting.column("id").in_(ids)))

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

        with DbSession.use(readonly=False) as db:
            db.insert(global_relationship)

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

        with DbSession.use(readonly=False) as db:
            db.insert_all(global_relationships)

        model = {"global_relationships": [gr.api_response() for gr in global_relationships]}
        await AppSettingPublisher.global_relationship_created(model)

        return global_relationships

    async def update_global_relationship(
        self, global_relationship: TGlobalCardRelationshipTypeParam, form: dict
    ) -> bool | tuple[GlobalCardRelationshipType, dict[str, Any]] | None:
        global_relationship = ServiceHelper.get_by_param(GlobalCardRelationshipType, global_relationship)
        if not global_relationship:
            return None
        mutable_keys = ["parent_name", "child_name", "description"]

        old_global_relationship_record = {}

        for key in form:
            if key not in mutable_keys:
                continue
            old_value = getattr(global_relationship, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_global_relationship_record[key] = convert_python_data(old_value)
            setattr(global_relationship, key, new_value)

        if not old_global_relationship_record:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(global_relationship)

        model = {}
        for key in form:
            if key not in mutable_keys or key not in old_global_relationship_record:
                continue
            model[key] = convert_python_data(getattr(global_relationship, key))

        await AppSettingPublisher.global_relationship_updated(global_relationship.get_uid(), model)

        return global_relationship, model

    async def delete_global_relationship(self, global_relationship: TGlobalCardRelationshipTypeParam) -> bool:
        global_relationship = ServiceHelper.get_by_param(GlobalCardRelationshipType, global_relationship)
        if not global_relationship:
            return False

        with DbSession.use(readonly=False) as db:
            db.delete(global_relationship)

        await AppSettingPublisher.global_relationship_deleted(global_relationship.get_uid())

        return True

    async def delete_selected_global_relationships(self, uids: list[str]) -> bool:
        ids: list[SnowflakeID] = [SnowflakeID.from_short_code(uid) for uid in uids]

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(GlobalCardRelationshipType).where(
                    GlobalCardRelationshipType.column("id").in_(ids)
                )
            )

        await AppSettingPublisher.selected_global_relationships_deleted(uids)

        return True
