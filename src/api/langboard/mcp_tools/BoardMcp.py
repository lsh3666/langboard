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
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def is_project_available(project_uid: str, service: DomainService) -> dict:
    p = service.project.get_by_id_like(project_uid)
    if not p:
        raise ValueError("Project not found")
    return {"title": p.title}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_project(project_uid: str, user_or_bot: User | Bot, service: DomainService) -> dict:
    result = service.project.get_details(user_or_bot, project_uid, False)
    if not result:
        raise ValueError("Project not found")
    project, response = result
    bot_scopes = service.project.get_api_bot_scope_list(project)
    bot_schedules = service.project.get_api_bot_schedule_list(project)
    if isinstance(user_or_bot, User):
        service.project.set_last_view(user_or_bot, project)
    return {"project": response, "project_bot_scopes": bot_scopes, "project_bot_schedules": bot_schedules}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_project_assigned_users(project_uid: str, service: DomainService) -> list[dict]:
    p = service.project.get_by_id_like(project_uid)
    if not p:
        raise ValueError("Project not found")
    return service.project.get_api_assigned_user_list(p)


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_project_columns(project_uid: str, service: DomainService) -> list[dict]:
    p = service.project.get_by_id_like(project_uid)
    if not p:
        raise ValueError("Project not found")
    return service.project_column.get_api_list_by_project(p)


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_project_labels(project_uid: str, service: DomainService) -> list[dict]:
    p = service.project.get_by_id_like(project_uid)
    if not p:
        raise ValueError("Project not found")
    return service.project_label.get_api_list_by_project(p)


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_project_checklists(project_uid: str, service: DomainService) -> dict:
    p = service.project.get_by_id_like(project_uid)
    if not p:
        raise ValueError("Project not found")
    checklists = service.checklist.get_api_list_only_by_project(p)
    return {"checklists": checklists}


@McpTool.add()
def get_global_relationships(service: DomainService) -> dict:
    global_rels = service.app_setting.get_api_global_relationship_list()
    return {"global_relationships": global_rels}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_column_bot_scopes(project_uid: str, service: DomainService) -> dict:
    p = service.project.get_by_id_like(project_uid)
    if not p:
        raise ValueError("Project not found")
    col_bot_scopes = service.project_column.get_api_bot_scopes_by_project(p)
    return {"column_bot_scopes": col_bot_scopes}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_column_bot_schedules(project_uid: str, service: DomainService) -> dict:
    p = service.project.get_by_id_like(project_uid)
    if not p:
        raise ValueError("Project not found")
    columns = service.project_column.get_api_list_by_project([p])
    col_bot_schedules = service.project_column.get_api_bot_schedule_list_by_project(p, columns)
    return {"column_bot_schedules": col_bot_schedules}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
def update_project_members(
    project_uid: str, user_or_bot: User | Bot, emails: list[str], service: DomainService
) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    result = service.project.update_assigned_users(user_or_bot, project_uid, emails)
    if result is None:
        raise ValueError("Failed to update")
    return {"message": "Updated"}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
def unassign_project_member(
    project_uid: str, assignee_uid: str, user_or_bot: User | Bot, service: DomainService
) -> dict:
    if not isinstance(user_or_bot, User):
        raise ValueError("Only users can access this endpoint")
    result = service.project.unassign_assignee(user_or_bot, project_uid, assignee_uid)
    if not result:
        raise ValueError("Failed to unassign")
    return {"message": "Unassigned"}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def is_project_assignee(project_uid: str, assignee_uid: str, service: DomainService) -> dict[str, bool]:
    target = service.user.get_by_id_like(assignee_uid)
    if not target:
        raise ValueError("User not found")
    result, _ = service.project.is_assigned(target, project_uid)
    return {"result": result}


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
def get_card_project_columns(project_uid: str, card_uid: str, service: DomainService) -> dict:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        raise ValueError("Card not found")
    project, card = params
    project_columns = service.project_column.get_api_list_by_project(project.id)
    return {"project_columns": project_columns}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def get_card_project_labels(project_uid: str, card_uid: str, service: DomainService) -> dict:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        raise ValueError("Card not found")
    project, card = params
    project_labels = service.project_label.get_api_list_by_project(project)
    return {"project_labels": project_labels}


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
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
def create_card(
    project_uid: str,
    column_uid: str,
    title: str,
    user_or_bot: User | Bot,
    service: DomainService,
    description: str | None = None,
    assign_user_uids: list[str] | None = None,
) -> dict:
    desc = EditorContentModel(content=description) if description else None
    result = service.card.create(user_or_bot, project_uid, column_uid, title, desc, assign_user_uids)
    if not result:
        raise ValueError("Failed to create")
    _, api_card = result
    return api_card


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
def change_card_details(
    project_uid: str,
    card_uid: str,
    user_or_bot: User | Bot,
    service: DomainService,
    title: str | None = None,
    description: str | None = None,
    deadline_at: str | None = None,
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
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
def archive_card(project_uid: str, card_uid: str, user_or_bot: User | Bot, service: DomainService) -> dict:
    p = service.project.get_by_id_like(project_uid)
    if not p:
        raise ValueError("Project not found")
    result = service.card.archive(user_or_bot, p, card_uid)
    if not result:
        raise ValueError("Failed to archive")
    return {"message": "Archived"}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
def delete_card(project_uid: str, card_uid: str, user_or_bot: User | Bot, service: DomainService) -> dict:
    result = service.card.delete(user_or_bot, project_uid, card_uid)
    if not result:
        raise ValueError("Failed to delete")
    return {"message": "Deleted"}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
def create_column(project_uid: str, user_or_bot: User | Bot, name: str, service: DomainService) -> dict:
    column = service.project_column.create(user_or_bot, project_uid, name)
    if not column:
        raise ValueError("Failed to create")
    return {**column.api_response(), "count": 0}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
def change_column_name(
    project_uid: str, column_uid: str, user_or_bot: User | Bot, name: str, service: DomainService
) -> dict:
    result = service.project_column.change_name(user_or_bot, project_uid, column_uid, name)
    if not result:
        raise ValueError("Failed")
    return {"name": name}


@McpTool.add()
@McpRoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
def delete_column(project_uid: str, column_uid: str, user_or_bot: User | Bot, service: DomainService) -> dict:
    result = service.project_column.delete(user_or_bot, project_uid, column_uid)
    if not result:
        raise ValueError("Failed")
    return {"message": "Deleted"}
