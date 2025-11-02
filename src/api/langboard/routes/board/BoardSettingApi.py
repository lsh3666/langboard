from fastapi import status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.utils.Converter import convert_python_data
from langboard_shared.filter import RoleFilter
from langboard_shared.models import (
    Bot,
    Card,
    ChatTemplate,
    InternalBot,
    Project,
    ProjectAssignedInternalBot,
    ProjectColumn,
    ProjectLabel,
    ProjectRole,
    User,
)
from langboard_shared.models.bases import ALL_GRANTED
from langboard_shared.models.InternalBot import InternalBotType
from langboard_shared.models.ProjectRole import ProjectRoleAction
from langboard_shared.security import Auth, RoleFinder
from langboard_shared.services import Service
from .forms import (
    ChangeInternalBotForm,
    ChangeInternalBotSettingsForm,
    ChangeRootOrderForm,
    CreateProjectLabelForm,
    UpdateProjectDetailsForm,
    UpdateProjectLabelDetailsForm,
    UpdateRolesForm,
)


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/details",
    tags=["Board.Settings"],
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
                            "internal_bots": [InternalBot],
                            "internal_bot_settings": {InternalBotType: ProjectAssignedInternalBot},
                            "current_auth_role_actions": [ALL_GRANTED, ProjectRoleAction],
                            "labels": [ProjectLabel],
                            "member_roles": {"<user uid>": [ALL_GRANTED, ProjectRoleAction]},
                            "chat_templates": [ChatTemplate],
                        }
                    },
                ),
                "internal_bots": [InternalBot],
                "project_columns": [(ProjectColumn, {"schema": {"count": "integer"}})],
                "cards": [(Card, {"schema": {"project_column_name": "string"}})],
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2001)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_project_details(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.get_details(user_or_bot, project_uid, is_setting=True)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    project, response = result
    assigned_internal_bots = await service.project.get_assigned_internal_bots(project, as_api=False)
    response["internal_bots"] = [internal_bot.api_response() for internal_bot, _ in assigned_internal_bots]
    response["internal_bot_settings"] = {
        internal_bot.bot_type.value: assigned_bot.api_response()
        for internal_bot, assigned_bot in assigned_internal_bots
    }

    internal_bots = await service.internal_bot.get_list(as_api=True, is_setting=False)
    columns = await service.project_column.get_all_by_project(project.id, as_api=True)
    cards = await service.card.get_all_by_project(project, as_api=True)
    templates = await service.chat.get_templates(Project.__tablename__, project_uid)

    return JsonResponse(
        content={
            "project": response,
            "internal_bots": internal_bots,
            "columns": columns,
            "cards": cards,
            "chat_templates": templates,
        }
    )


@AppRouter.schema(form=UpdateProjectDetailsForm)
@AppRouter.api.put(
    "/board/{project_uid}/settings/details",
    tags=["Board.Settings"],
    description="Change project details.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def change_project_details(
    project_uid: str,
    form: UpdateProjectDetailsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project.update(user_or_bot, project_uid, form.model_dump())
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/board/{project_uid}/settings/internal-bot",
    tags=["Board.Settings"],
    description="Change internal bot for a project.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2019).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def change_project_internal_bot(
    project_uid: str, form: ChangeInternalBotForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.change_internal_bot(project_uid, form.internal_bot_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2019, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/board/{project_uid}/settings/internal-bot/settings",
    tags=["Board.Settings"],
    description="Change internal bot settings for a project.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2019).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def change_project_internal_bot_settings(
    project_uid: str, form: ChangeInternalBotSettingsForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.change_internal_bot_settings(
        project_uid, form.bot_type, form.use_default_prompt, form.prompt
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2019, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/board/{project_uid}/settings/roles/user/{user_uid}",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2006).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def update_project_user_roles(
    project_uid: str, user_uid: str, form: UpdateRolesForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.update_user_roles(project_uid, user_uid, form.roles)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2006, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=CreateProjectLabelForm)
@AppRouter.api.post(
    "/board/{project_uid}/settings/label",
    tags=["Board.Settings"],
    description="Create a project label.",
    responses=(
        OpenApiSchema().suc({"label": ProjectLabel}, 201).auth().forbidden().err(404, ApiErrorCode.NF2001).get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def create_project_label(
    project_uid: str,
    form: CreateProjectLabelForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_label.create(user_or_bot, project_uid, form.name, form.color, form.description)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    _, api_label = result

    return JsonResponse(content={"label": api_label}, status_code=status.HTTP_201_CREATED)


@AppRouter.schema(form=UpdateProjectLabelDetailsForm)
@AppRouter.api.put(
    "/board/{project_uid}/settings/label/{label_uid}/details",
    tags=["Board.Settings"],
    description="Change project label details.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "name?": "string",
                "color?": "string",
                "description?": "string",
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2007)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def change_project_label_details(
    project_uid: str,
    label_uid: str,
    form: UpdateProjectLabelDetailsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_label.update(user_or_bot, project_uid, label_uid, form.model_dump())
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2007, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        response = {}
        for key in UpdateProjectLabelDetailsForm.model_fields:
            if ["name", "color", "description"].count(key) == 0:
                continue
            value = getattr(form, key)
            if value is None:
                continue
            response[key] = convert_python_data(value)
        return JsonResponse(content=response)

    return JsonResponse(content=result)


@AppRouter.schema(form=ChangeRootOrderForm)
@AppRouter.api.put(
    "/board/{project_uid}/settings/label/{label_uid}/order",
    tags=["Board.Settings"],
    description="Change project label order.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2007).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def change_project_label_order(
    project_uid: str, label_uid: str, form: ChangeRootOrderForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project_label.change_order(project_uid, label_uid, form.order)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2007, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/settings/label/{label_uid}",
    tags=["Board.Settings"],
    description="Delete a project label.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2007).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def delete_label(
    project_uid: str, label_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project_label.delete(user_or_bot, project_uid, label_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2007, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/board/{project_uid}/settings/delete",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2001).err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def delete_project(
    project_uid: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    if project.owner_id != user.id and not user.is_admin:
        return JsonResponse(content=ApiErrorCode.PE2001, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project.delete(user, project_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
