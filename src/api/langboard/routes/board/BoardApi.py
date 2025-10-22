from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import status
from models import (
    Bot,
    Card,
    CardRelationship,
    Checklist,
    GlobalCardRelationshipType,
    Project,
    ProjectColumn,
    ProjectColumnBotSchedule,
    ProjectColumnBotScope,
    ProjectLabel,
    ProjectRole,
    User,
)
from models.bases import ALL_GRANTED
from models.ProjectRole import ProjectRoleAction
from ...filter import RoleFilter
from ...security import Auth, RoleFinder
from ...services import Service
from .forms import InviteProjectMemberForm, ProjectInvitationForm


@AppRouter.schema()
@AppRouter.api.post(
    "/board/{project_uid}/available",
    tags=["Board"],
    description="Check if the project is available.",
    responses=OpenApiSchema().suc({"title": "string"}).auth().forbidden().err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def is_project_available(project_uid: str, service: Service = Service.scope()) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    return JsonResponse(content={"title": project.title})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}",
    tags=["Board"],
    description="Get project details.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "project": (
                    Project,
                    {
                        "schema": {
                            "all_members": [User],
                            "invited_member_uids": "string[]",
                            "current_auth_role_actions": [ALL_GRANTED, ProjectRoleAction],
                            "labels": [ProjectLabel],
                        }
                    },
                )
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2001)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_project(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.get_details(user_or_bot, project_uid, is_setting=False)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    project, response = result
    if isinstance(user_or_bot, User):
        await service.project.set_last_view(user_or_bot, project)
    return JsonResponse(content={"project": response})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/assigned-users",
    tags=["Board"],
    description="Get project assigned users.",
    responses=OpenApiSchema().suc({"users": [User]}).auth().forbidden().err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_project_assigned_users(project_uid: str, service: Service = Service.scope()) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    users = await service.project.get_assigned_users(project, as_api=True)

    return JsonResponse(content={"users": users})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/columns",
    tags=["Board"],
    description="Get project columns.",
    responses=(
        OpenApiSchema()
        .suc({"columns": [(ProjectColumn, {"schema": {"count": "integer"}})]})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2001)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_project_columns(project_uid: str, service: Service = Service.scope()) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    columns = await service.project_column.get_all_by_project(project.id, as_api=True)
    return JsonResponse(content={"columns": columns})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/labels",
    tags=["Board"],
    description="Get project labels.",
    responses=(OpenApiSchema().suc({"labels": [ProjectLabel]}).auth().forbidden().err(404, ApiErrorCode.NF2001).get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_project_labels(project_uid: str, service: Service = Service.scope()) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    labels = await service.project_label.get_all(project.id, as_api=True)
    return JsonResponse(content={"labels": labels})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/cards",
    tags=["Board"],
    description="Get project cards.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "cards": [
                    (
                        Card,
                        {
                            "schema": {
                                "project_column_name": "string",
                                "count_comment": "integer",
                                "member_uids": "string[]",
                                "relationships": [CardRelationship],
                                "labels": [ProjectLabel],
                            }
                        },
                    )
                ],
                "column_bot_scopes": [ProjectColumnBotScope],
                "column_bot_schedules": [ProjectColumnBotSchedule],
                "checklists": [Checklist],
                "global_relationships": [GlobalCardRelationshipType],
                "columns": [(ProjectColumn, {"schema": {"count": "integer"}})],
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2001)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_project_cards(project_uid: str, service: Service = Service.scope()) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    global_relationships = await service.app_setting.get_global_relationships(as_api=True)
    columns = await service.project_column.get_all_by_project(project.id, as_api=True)
    cards = await service.card.get_board_list(project)
    checklists = await service.checklist.get_list_only_by_project(project)
    column_bot_scopes = await service.project_column.get_bot_scopes_by_project(project)
    column_bot_schedules = await service.project_column.get_bot_schedules_by_project(project, columns, as_api=True)

    for card in cards:
        card["project_column_name"] = next(
            (col["name"] for col in columns if col["uid"] == card["project_column_uid"]), ""
        )

    return JsonResponse(
        content={
            "cards": cards,
            "checklists": [checklist.api_response() for checklist in checklists],
            "global_relationships": global_relationships,
            "columns": columns,
            "column_bot_scopes": [scope.api_response() for scope in column_bot_scopes],
            "column_bot_schedules": column_bot_schedules,
        }
    )


@AppRouter.api.put(
    "/board/{project_uid}/assigned-users",
    tags=["Board"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def update_project_member(
    project_uid: str,
    form: InviteProjectMemberForm,
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project.update_assigned_users(user, project_uid, form.emails)
    if result is None:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/board/{project_uid}/unassign/{assignee_uid}",
    tags=["Board"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2005).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def unassign_project_assignee(
    project_uid: str, assignee_uid: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.unassign_assignee(user, project_uid, assignee_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/is-assigned/{assignee_uid}",
    tags=["Board"],
    description="Check if the user is assigned to the project.",
    responses=(
        OpenApiSchema()
        .suc({"result": "bool", "is_bot_disabled": "bool?"})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF1004)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def is_project_assignee(project_uid: str, assignee_uid: str, service: Service = Service.scope()) -> JsonResponse:
    target = await service.user.get_by_uid(assignee_uid)
    if not target:
        return JsonResponse(content=ApiErrorCode.NF1004, status_code=status.HTTP_404_NOT_FOUND)

    result, _ = await service.project.is_assigned(target, project_uid)
    return JsonResponse(content={"result": result})


@AppRouter.api.post(
    "/project/invite/details/{token}",
    tags=["Board"],
    responses=(
        OpenApiSchema().suc({"project": {"title": "string"}}).auth().forbidden().err(404, ApiErrorCode.NF2001).get()
    ),
)
@AuthFilter.add("user")
async def get_invited_project_title(
    token: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project_invitation.get_project_by_token(user, token)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"project": {"title": project.title}})


@AppRouter.api.post(
    "/project/invite/accept",
    tags=["Board"],
    responses=OpenApiSchema().auth().forbidden().err(406, ApiErrorCode.NF2002).get(),
)
@AuthFilter.add("user")
async def accept_project_invitation(
    form: ProjectInvitationForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project_invitation.accept(user, form.invitation_token)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2002, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    return JsonResponse(content={"project_uid": result})


@AppRouter.api.post(
    "/project/invite/decline",
    tags=["Board"],
    responses=OpenApiSchema().auth().forbidden().err(406, ApiErrorCode.NF2002).get(),
)
@AuthFilter.add("user")
async def decline_project_invitation(
    form: ProjectInvitationForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project_invitation.decline(user, form.invitation_token)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2002, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    return JsonResponse()
