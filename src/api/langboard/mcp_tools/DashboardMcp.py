from langboard_shared.domain.models import Bot, User
from langboard_shared.domain.services import DomainService
from ..mcp_integration import McpTool


@McpTool.add("user")
def get_starred_projects(user_or_bot: User | Bot, service: DomainService) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    projects = service.project.get_api_starred_project_list(user_or_bot)
    return {"projects": projects}


@McpTool.add("user")
def get_dashboard_projects(user_or_bot: User | Bot, service: DomainService) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    projects, _ = service.project.get_api_list(user_or_bot)
    return {"projects": projects}


@McpTool.add("user")
def toggle_star_project(project_uid: str, user_or_bot: User | Bot, service: DomainService) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    result = service.project.toggle_star(user_or_bot, project_uid)
    if not result:
        raise ValueError("Failed")
    return {"message": "Toggled"}
