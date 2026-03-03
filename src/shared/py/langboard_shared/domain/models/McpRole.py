from enum import Enum
from .bases.BaseRoleModel import BaseRoleModel


class McpRoleAction(Enum):
    Read = "read"  # Read own MCP tool groups
    Create = "create"  # Create MCP tool groups
    Update = "update"  # Update own MCP tool groups (includes activate/deactivate)
    Delete = "delete"  # Delete own MCP tool groups


class McpRole(BaseRoleModel, table=True):
    @staticmethod
    def get_all_actions() -> list[Enum]:
        return list(McpRoleAction._member_map_.values())

    @staticmethod
    def get_default_actions() -> list[Enum]:
        # By default, grant all MCP permissions
        return McpRole.get_all_actions()
