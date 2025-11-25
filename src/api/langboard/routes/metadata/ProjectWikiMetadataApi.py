from fastapi import Depends, status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse, SocketTopic
from langboard_shared.domain.models import Bot, Project, ProjectRole, ProjectWiki, ProjectWikiMetadata, User
from langboard_shared.domain.models.ProjectRole import ProjectRoleAction
from langboard_shared.domain.services import DomainService
from langboard_shared.filter import RoleFilter
from langboard_shared.helpers import InfraHelper
from langboard_shared.publishers import MetadataPublisher
from langboard_shared.security import Auth, RoleFinder
from .MetadataForm import MetadataDeleteForm, MetadataForm, MetadataGetModel
from .MetadataHelper import create_metadata_api_schema


@AppRouter.schema()
@AppRouter.api.get(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Metadata"],
    description="Get wiki metadata.",
    responses=(create_metadata_api_schema("list").err(403, ApiErrorCode.PE2005).err(404, ApiErrorCode.NF2008).get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_wiki_metadata(
    project_uid: str,
    wiki_uid: str,
    user_or_bot: User | Bot = Auth.scope("all"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectWiki, wiki_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)
    _, wiki = params

    if isinstance(user_or_bot, User) and not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)

    metadata = await service.metadata.get_all_as_api(ProjectWikiMetadata, wiki, as_dict=True)
    return JsonResponse(content={"metadata": metadata})


@AppRouter.schema(query=MetadataGetModel)
@AppRouter.api.get(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}/key",
    tags=["Metadata"],
    description="Get wiki metadata by key.",
    responses=(create_metadata_api_schema("key").err(403, ApiErrorCode.PE2005).err(404, ApiErrorCode.NF2008).get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_wiki_metadata_by_key(
    project_uid: str,
    wiki_uid: str,
    get_query: MetadataGetModel = Depends(),
    user_or_bot: User | Bot = Auth.scope("all"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectWiki, wiki_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)
    _, wiki = params

    if isinstance(user_or_bot, User) and not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)

    metadata = await service.metadata.get_by_key_as_api(ProjectWikiMetadata, wiki, get_query.key)
    value = metadata.get("value", None) if metadata else None
    return JsonResponse(content={get_query.key: value})


@AppRouter.schema(form=MetadataForm)
@AppRouter.api.post(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Metadata"],
    description="Save wiki metadata.",
    responses=(create_metadata_api_schema().err(403, ApiErrorCode.PE2005).err(404, ApiErrorCode.NF2017).get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def save_wiki_metadata(
    project_uid: str,
    wiki_uid: str,
    form: MetadataForm,
    user_or_bot: User | Bot = Auth.scope("all"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectWiki, wiki_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2017, status_code=status.HTTP_404_NOT_FOUND)
    _, wiki = params

    if isinstance(user_or_bot, User) and not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)

    metadata = await service.metadata.save(ProjectWikiMetadata, wiki, form.key, form.value, form.old_key)
    if metadata is None:
        return JsonResponse(content=ApiErrorCode.NF2017, status_code=status.HTTP_404_NOT_FOUND)

    await MetadataPublisher.updated_metadata(SocketTopic.BoardWikiPrivate, wiki_uid, form.key, form.value, form.old_key)
    return JsonResponse()


@AppRouter.schema(form=MetadataDeleteForm)
@AppRouter.api.delete(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Metadata"],
    description="Delete wiki metadata.",
    responses=(create_metadata_api_schema().err(403, ApiErrorCode.PE2005).err(404, ApiErrorCode.NF2008).get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def delete_wiki_metadata(
    form: MetadataDeleteForm,
    project_uid: str,
    wiki_uid: str,
    user_or_bot: User | Bot = Auth.scope("all"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectWiki, wiki_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)
    _, wiki = params

    if isinstance(user_or_bot, User) and not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)

    await service.metadata.delete(ProjectWikiMetadata, wiki, form.keys)

    await MetadataPublisher.deleted_metadata(SocketTopic.BoardWikiPrivate, wiki_uid, form.keys)
    return JsonResponse()
