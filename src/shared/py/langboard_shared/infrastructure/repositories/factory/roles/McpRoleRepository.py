from .....core.utils.Extractor import extract_func_param
from .....domain.models import McpRole
from .BaseRoleRepository import BaseRoleRepository


class McpRoleRepository(BaseRoleRepository[McpRole]):
    @staticmethod
    def model_cls():
        return McpRole

    @staticmethod
    def name():
        """DO NOT EDIT THIS METHOD"""
        return "mcp_role"

    @extract_func_param(4)(McpRole)  # type: ignore
    def get_list(self, **kwargs):
        return super().get_list(**kwargs)

    @extract_func_param(4)(McpRole)  # type: ignore
    def get_one(self, **kwargs):
        return super().get_one(**kwargs)

    @extract_func_param(3)(McpRole)  # type: ignore
    def grant(self, **kwargs):
        return super().grant(**kwargs)

    @extract_func_param(4)(McpRole)  # type: ignore
    def grant_all(self, **kwargs):
        return super().grant_all(**kwargs)

    @extract_func_param(4)(McpRole)  # type: ignore
    def grant_default(self, **kwargs):
        return super().grant_default(**kwargs)

    @extract_func_param(4)(McpRole)  # type: ignore
    def withdraw(self, **kwargs):
        return super().withdraw(**kwargs)
