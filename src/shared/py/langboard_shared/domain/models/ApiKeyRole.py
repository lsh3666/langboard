from enum import Enum
from .bases import BaseRoleModel


class ApiKeyRoleAction(Enum):
    Read = "read"  # Read own API keys
    Create = "create"  # Create API keys
    Update = "update"  # Update own API keys (includes activate/deactivate)
    Delete = "delete"  # Delete own API keys


class ApiKeyRole(BaseRoleModel, table=True):
    @staticmethod
    def get_all_actions() -> list[Enum]:
        return list(ApiKeyRoleAction._member_map_.values())

    @staticmethod
    def get_default_actions() -> list[Enum]:
        # By default, grant all API key permissions
        return ApiKeyRole.get_all_actions()
