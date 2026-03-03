from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.domain.models import User
from langboard_shared.domain.services import DomainService
from langboard_shared.security import Auth


@AppRouter.api.post("/settings/roles", tags=["AppSettings"], responses=OpenApiSchema().auth().forbidden().get())
@AuthFilter.add("user")
def get_setting_roles(user: User = Auth.scope("user"), service: DomainService = DomainService.scope()) -> JsonResponse:
    setting_role = service.user.get_setting_role(user)
    api_key_role = service.api_key.get_role(user)
    mcp_role = service.mcp_tool_group.get_role(user)

    return JsonResponse(
        content={
            "setting_role_actions": setting_role.actions if setting_role else None,
            "api_key_role_actions": api_key_role.actions if api_key_role else None,
            "mcp_role_actions": mcp_role.actions if mcp_role else None,
        }
    )
