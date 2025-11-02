from fastapi import File, UploadFile, status
from langboard_shared.core.db import EditorContentModel
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.routing.Exception import MissingException
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.storage import Storage, StorageName
from langboard_shared.core.utils.Converter import convert_python_data
from langboard_shared.filter import RoleFilter
from langboard_shared.helpers import ServiceHelper
from langboard_shared.models import Bot, Project, ProjectRole, ProjectWiki, ProjectWikiAttachment, User
from langboard_shared.models.ProjectRole import ProjectRoleAction
from langboard_shared.security import Auth, RoleFinder
from langboard_shared.services import Service
from .forms import (
    AssigneesForm,
    ChangeChildOrderForm,
    ChangeWikiDetailsForm,
    ChangeWikiPublicForm,
    WikiForm,
)


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/wikis",
    tags=["Board.Wiki"],
    description="Get project wikis.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "wikis": [
                    (
                        ProjectWiki,
                        {
                            "schema": {
                                "assigned_members": [User],
                            }
                        },
                    )
                ],
                "project_members": [User],
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
async def get_project_wikis(
    project_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    wikis = await service.project_wiki.get_board_list(user_or_bot, project_uid)
    project_members = await service.project.get_assigned_users(project, as_api=True)
    return JsonResponse(content={"wikis": wikis, "project_members": project_members})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/wiki/{wiki_uid}",
    tags=["Board.Wiki"],
    description="Get project wiki details.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "wiki": (
                    ProjectWiki,
                    {
                        "schema": {
                            "assigned_members": [User],
                        }
                    },
                )
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2008)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_project_wiki_details(
    project_uid: str,
    wiki_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectWiki, wiki_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)
    project, project_wiki = params

    api_wiki = await service.project_wiki.convert_to_api_response(user_or_bot, project, project_wiki)
    if not api_wiki:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"wiki": api_wiki})


@AppRouter.schema(form=WikiForm)
@AppRouter.api.post(
    "/board/{project_uid}/wiki",
    tags=["Board.Wiki"],
    description="Create a project wiki.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "wiki": (
                    ProjectWiki,
                    {
                        "schema": {
                            "assigned_members": [User],
                        }
                    },
                )
            },
            201,
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2001)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def create_project_wiki(
    project_uid: str,
    form: WikiForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.create(user_or_bot, project_uid, form.title, form.content)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    _, api_wiki = result

    return JsonResponse(content={"wiki": api_wiki}, status_code=status.HTTP_201_CREATED)


@AppRouter.schema(form=ChangeWikiDetailsForm)
@AppRouter.api.put(
    "/board/{project_uid}/wiki/{wiki_uid}/details",
    tags=["Board.Wiki"],
    description="Change project wiki details.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "title?": "string",
                "content?": EditorContentModel.api_schema(),
            }
        )
        .auth()
        .forbidden()
        .err(403, ApiErrorCode.PE2005)
        .err(404, ApiErrorCode.NF2008)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def change_project_wiki_details(
    project_uid: str,
    wiki_uid: str,
    form: ChangeWikiDetailsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project_wiki = await service.project_wiki.get_by_uid(wiki_uid)
    if not project_wiki:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(user_or_bot, User) and not await service.project_wiki.is_assigned(user_or_bot, project_wiki):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)

    form_dict = {}
    for key in ChangeWikiDetailsForm.model_fields:
        value = getattr(form, key)
        if value is None:
            continue
        form_dict[key] = value

    result = await service.project_wiki.update(user_or_bot, project_uid, wiki_uid, form_dict)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        response = {}
        for key in ChangeWikiDetailsForm.model_fields:
            if ["title", "content"].count(key) == 0:
                continue
            value = getattr(form, key)
            if value is None:
                continue
            response[key] = convert_python_data(value)
        return JsonResponse(content=response)

    return JsonResponse(content=result)


@AppRouter.schema(form=ChangeWikiPublicForm)
@AppRouter.api.put(
    "/board/{project_uid}/wiki/{wiki_uid}/public",
    tags=["Board.Wiki"],
    description="Change project wiki public status.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2005).err(404, ApiErrorCode.NF2008).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def change_project_wiki_public(
    project_uid: str,
    wiki_uid: str,
    form: ChangeWikiPublicForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project_wiki = await service.project_wiki.get_by_uid(wiki_uid)
    if not project_wiki:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(user_or_bot, User) and not await service.project_wiki.is_assigned(user_or_bot, project_wiki):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project_wiki.change_public(user_or_bot, project_uid, project_wiki, form.is_public)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=AssigneesForm)
@AppRouter.api.put(
    "/board/{project_uid}/wiki/{wiki_uid}/assignees",
    tags=["Board.Wiki"],
    description="Update project wiki assignees.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2005).err(404, ApiErrorCode.NF2008).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def update_project_wiki_assignees(
    project_uid: str,
    wiki_uid: str,
    form: AssigneesForm,
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project_wiki = await service.project_wiki.get_by_uid(wiki_uid)
    if not project_wiki:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    if not await service.project_wiki.is_assigned(user, project_wiki):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)

    if not form.assignees:
        raise MissingException("body", "assignees")

    result = await service.project_wiki.update_assignees(user, project_uid, project_wiki, form.assignees)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=ChangeChildOrderForm)
@AppRouter.api.put(
    "/board/{project_uid}/wiki/{wiki_uid}/order",
    tags=["Board.Wiki"],
    description="Change project wiki order.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2008).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def change_project_wiki_order(
    project_uid: str,
    wiki_uid: str,
    form: ChangeChildOrderForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.change_order(project_uid, wiki_uid, form.order)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.post(
    "/board/{project_uid}/wiki/{wiki_uid}/attachment",
    tags=["Board.Wiki"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                **ProjectWikiAttachment.api_schema(),
                "user": User,
            },
            201,
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2008)
        .err(500, ApiErrorCode.OP1002)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def upload_wiki_attachment(
    project_uid: str,
    wiki_uid: str,
    attachment: UploadFile = File(),
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not attachment:
        raise MissingException("body", "attachment")

    file_model = Storage.upload(attachment, StorageName.Wiki)
    if not file_model:
        return JsonResponse(
            content=ApiErrorCode.OP1002,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    result = await service.project_wiki.upload_attachment(user, project_uid, wiki_uid, file_model)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={**result.api_response(), "user": user.api_response()},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/wiki/{wiki_uid}",
    tags=["Board.Wiki"],
    description="Delete project wiki.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2005).err(404, ApiErrorCode.NF2008).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def delete_project_wiki(
    project_uid: str,
    wiki_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project_wiki = await service.project_wiki.get_by_uid(wiki_uid)
    if not project_wiki:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(user_or_bot, User) and not await service.project_wiki.is_assigned(user_or_bot, project_wiki):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project_wiki.delete(user_or_bot, project_uid, project_wiki)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
