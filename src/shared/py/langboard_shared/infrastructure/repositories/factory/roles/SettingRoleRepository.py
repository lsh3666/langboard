from .....core.utils.Extractor import extract_func_param
from .....domain.models import SettingRole
from .BaseRoleRepository import BaseRoleRepository


class SettingRoleRepository(BaseRoleRepository[SettingRole]):
    @staticmethod
    def model_cls():
        return SettingRole

    @staticmethod
    def name():
        """DO NOT EDIT THIS METHOD"""
        return "setting_role"

    @extract_func_param(4)(SettingRole)  # type: ignore
    def get_list(self, **kwargs):
        return super().get_list(**kwargs)

    @extract_func_param(4)(SettingRole)  # type: ignore
    def get_one(self, **kwargs):
        return super().get_one(**kwargs)

    @extract_func_param(3)(SettingRole)  # type: ignore
    def grant(self, **kwargs):
        return super().grant(**kwargs)

    @extract_func_param(4)(SettingRole)  # type: ignore
    def grant_all(self, **kwargs):
        return super().grant_all(**kwargs)

    @extract_func_param(4)(SettingRole)  # type: ignore
    def grant_default(self, **kwargs):
        return super().grant_default(**kwargs)

    @extract_func_param(4)(SettingRole)  # type: ignore
    def withdraw(self, **kwargs):
        return super().withdraw(**kwargs)
