from langboard_shared.core.db import EditorContentModel
from langboard_shared.core.types import SafeDateTime
from langboard_shared.core.utils.Converter import convert_python_data
from langboard_shared.domain.models import Bot, Card, Project, ProjectRole, User
from langboard_shared.domain.models.bases import ALL_GRANTED
from langboard_shared.domain.models.ProjectRole import ProjectRoleAction
from langboard_shared.domain.services.DomainService import DomainService
from langboard_shared.helpers import InfraHelper
from langboard_shared.security import RoleFinder
from ..mcp_integration import McpRoleFilter, McpTool


@McpTool.add()
def get_cards(project_uid: str, service: DomainService) -> dict:
    project = service.project.get_by_id_like(project_uid)
    if not project:
        raise ValueError("Project not found")
    cards = service.card.get_api_list_by_project(project)
    return {"cards": cards}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_card(project_uid: str, card_uid: str, service: DomainService) -> dict:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        raise ValueError("Card not found")
    project, card = params
    api_card = service.card.get_details(project, card)
    if not api_card:
        raise ValueError("Card not found")
    return api_card


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_card_checklists(project_uid: str, card_uid: str, service: DomainService) -> dict:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        raise ValueError("Card not found")
    _, card = params
    checklists = service.checklist.get_api_list_by_card(card)
    return {"checklists": checklists}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_card_attachments(project_uid: str, card_uid: str, service: DomainService) -> dict:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        raise ValueError("Card not found")
    _, card = params
    attachments = service.card_attachment.get_api_list_by_card(card)
    return {"attachments": attachments}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_card_bot_scopes(project_uid: str, card_uid: str, user_or_bot: User | Bot, service: DomainService) -> dict:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        raise ValueError("Card not found")
    project, card = params
    api_card = service.card.get_details(project, card)
    if not api_card:
        raise ValueError("Card not found")
    bot_scopes = []
    can_set = isinstance(user_or_bot, Bot)
    if isinstance(user_or_bot, User):
        actions = service.project.get_user_role_actions_by_project(user_or_bot, project)
        can_set = ALL_GRANTED in actions or ProjectRoleAction.Update.value in actions
    if can_set:
        bot_scopes = service.card.get_api_bot_scope_list(project, card)
    return {"bot_scopes": bot_scopes}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
def create_card(
    project_uid: str,
    column_uid: str,
    title: str,
    description: str | None,
    assign_user_uids: list[str] | None,
    user_or_bot: User | Bot,
    service: DomainService,
) -> dict:
    description_model = EditorContentModel(content=description or "")
    result = service.card.create(user_or_bot, project_uid, column_uid, title, description_model, assign_user_uids)
    if not result:
        raise ValueError("Failed to create")
    _, api_card = result
    return api_card


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
def change_card_details(
    project_uid: str,
    card_uid: str,
    title: str | None,
    description: str | None,
    deadline_at: str | None,
    user_or_bot: User | Bot,
    service: DomainService,
) -> dict:
    form_dict = {}
    if title is not None:
        form_dict["title"] = title
    if description is not None:
        form_dict["description"] = EditorContentModel(content=description)
    if deadline_at is not None:
        if deadline_at:
            val = SafeDateTime.fromisoformat(deadline_at)
            if val.tzinfo is None:
                val = val.replace(tzinfo=SafeDateTime.now().astimezone().tzinfo)
            form_dict["deadline_at"] = val
        else:
            form_dict["deadline_at"] = None
    result = service.card.update(user_or_bot, project_uid, card_uid, form_dict)
    if not result:
        raise ValueError("Failed to update")
    if result is True:
        response = {}
        if title is not None:
            response["title"] = title
        if description is not None:
            response["description"] = convert_python_data(EditorContentModel(content=description))
        if deadline_at is not None:
            response["deadline_at"] = deadline_at
        return response
    return result


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
def archive_card(project_uid: str, card_uid: str, user_or_bot: User | Bot, service: DomainService) -> dict:
    p = service.project.get_by_id_like(project_uid)
    if not p:
        raise ValueError("Project not found")
    result = service.card.archive(user_or_bot, p, card_uid)
    if not result:
        raise ValueError("Failed to archive")
    return {"message": "Archived"}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.CardDelete], RoleFinder.project)
def delete_card(project_uid: str, card_uid: str, user_or_bot: User | Bot, service: DomainService) -> dict:
    result = service.card.delete(user_or_bot, project_uid, card_uid)
    if not result:
        raise ValueError("Failed to delete")
    return {"message": "Deleted"}
