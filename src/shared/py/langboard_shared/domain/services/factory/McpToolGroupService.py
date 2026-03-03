from typing import Any, Literal, Sequence
from ....core.domain import BaseDomainService
from ....core.domain.BaseDomainService import TMutableValidatorMap
from ....core.types import SafeDateTime, SnowflakeID
from ....core.types.ParamTypes import TMcpToolGroupParam, TUserParam
from ....Env import Env
from ....helpers import InfraHelper
from ....publishers import AppSettingPublisher, UserPublisher
from ...models import McpRole, McpToolGroup, User
from ...models.McpRole import McpRoleAction


class McpToolGroupService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "mcp_tool_group"

    def get_by_id_like(self, tool: TMcpToolGroupParam | None) -> McpToolGroup | None:
        tool = InfraHelper.get_by_id_like(McpToolGroup, tool)
        return tool

    def get_api_list_by_user(self, user_id: SnowflakeID) -> list[dict[str, Any]]:
        groups = self.repo.mcp_tool_group.get_list_by_user(user_id)
        return [group.api_response() for group in groups]

    def get_api_global_list(self) -> list[dict[str, Any]]:
        groups = self.repo.mcp_tool_group.get_global_list()
        return [group.api_response() for group in groups]

    def create(
        self, user: User | None, name: str, description: str, tools: list[str], activate: bool = True
    ) -> McpToolGroup | None:
        tool_group = McpToolGroup(
            user_id=user.id if user else None,
            name=name,
            description=description,
            tools=tools,
            activated_at=SafeDateTime.now() if activate else None,
        )
        self.repo.mcp_tool_group.insert(tool_group)

        AppSettingPublisher.mcp_tool_group_created(tool_group)
        return tool_group

    def update(
        self, user: User, tool_group: TMcpToolGroupParam | None, form: dict
    ) -> dict[str, Any] | Literal[True] | None:
        tool_group = InfraHelper.get_by_id_like(McpToolGroup, tool_group)
        if not tool_group:
            return None

        validators: TMutableValidatorMap = {
            "name": "not_empty",
            "description": "default",
            "tools": "default",
            "activated_at": "default",
        }

        old_record = self.apply_mutates(tool_group, form, validators)
        if not old_record:
            return True

        self.repo.mcp_tool_group.update(tool_group)

        model = {}
        for key in form:
            if key not in validators or key not in old_record:
                continue
            model[key] = getattr(tool_group, key)

        AppSettingPublisher.mcp_tool_group_updated(tool_group, model)

        return model

    def activate(self, tool_group: TMcpToolGroupParam | None) -> bool:
        tool_group = InfraHelper.get_by_id_like(McpToolGroup, tool_group)
        if not tool_group:
            return False

        if tool_group.activated_at:
            return True

        tool_group.activated_at = SafeDateTime.now()
        self.repo.mcp_tool_group.update(tool_group)

        AppSettingPublisher.mcp_tool_group_updated(tool_group, {"activated_at": tool_group.activated_at})

        return True

    def deactivate(self, tool_group: TMcpToolGroupParam | None) -> bool:
        tool_group = InfraHelper.get_by_id_like(McpToolGroup, tool_group)
        if not tool_group:
            return False

        if not tool_group.activated_at:
            return True

        tool_group.activated_at = None
        self.repo.mcp_tool_group.update(tool_group)

        AppSettingPublisher.mcp_tool_group_updated(tool_group, {"activated_at": tool_group.activated_at})

        return True

    def delete(self, tool_group: TMcpToolGroupParam | None) -> bool:
        tool_group = InfraHelper.get_by_id_like(McpToolGroup, tool_group)
        if not tool_group:
            return False

        self.repo.mcp_tool_group.delete(tool_group)

        AppSettingPublisher.mcp_tool_group_deleted(tool_group.get_uid())

        return True

    def delete_selected(self, user: User, tool_groups: Sequence[TMcpToolGroupParam]) -> bool:
        if not isinstance(tool_groups, Sequence) or isinstance(tool_groups, str):
            tool_groups = [tool_groups]

        group_ids = [InfraHelper.convert_id(tool_group) for tool_group in tool_groups]

        tool_groups = InfraHelper.get_all_by(McpToolGroup, "id", group_ids)

        deletable_tool_groups = [
            tool_group for tool_group in tool_groups if tool_group.user_id == user.id or tool_group.user_id is None
        ]
        self.repo.mcp_tool_group.delete(deletable_tool_groups)

        AppSettingPublisher.selected_mcp_tool_groups_deleted(
            [tool_group.get_uid() for tool_group in deletable_tool_groups]
        )

        return True

    def get_role(self, user: TUserParam) -> McpRole | None:
        user_id = InfraHelper.convert_id(user)
        return self.repo.role.mcp.get_one(user_id=user_id)

    def grant_roles(
        self,
        user: TUserParam,
        actions: McpRoleAction | str | list[McpRoleAction | str] | list[McpRoleAction] | list[str],
    ) -> McpRole | None:
        user_model = InfraHelper.get_by_id_like(User, user)
        if not user_model:
            return None

        if user_model.is_admin or user_model.email in Env.FULL_ADMIN_ACCESS_EMAILS:
            return self.grant_all_roles(user)

        if not isinstance(actions, list):
            actions = [actions]
        action_strs = [action.value if isinstance(action, McpRoleAction) else action for action in actions]

        # Handle Read permission dependencies
        action_strs = self._normalize_role_actions(action_strs)

        role = self.repo.role.mcp.grant(actions=action_strs, user_id=user_model.id)

        UserPublisher.mcp_roles_updated(InfraHelper.convert_uid(user), role.actions)

        return role

    def _normalize_role_actions(self, actions: list[str]) -> list[str]:
        """Ensure Read permission dependencies are properly handled"""
        if not actions:
            return actions

        result = set(actions)
        read_action = McpRoleAction.Read.value
        dependent_actions = [
            McpRoleAction.Create.value,
            McpRoleAction.Update.value,
            McpRoleAction.Delete.value,
        ]

        # If any Create/Update/Delete is added, add Read too
        if any(action in result for action in dependent_actions):
            result.add(read_action)

        # If Read is removed, remove all dependent actions
        if read_action not in result:
            for action in dependent_actions:
                result.discard(action)

        return list(result)

    def grant_all_roles(self, user: TUserParam) -> McpRole:
        user_id = InfraHelper.convert_id(user)
        role = self.repo.role.mcp.grant_all(user_id=user_id)

        UserPublisher.mcp_roles_updated(InfraHelper.convert_uid(user), role.actions)

        return role
