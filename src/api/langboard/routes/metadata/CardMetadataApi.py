from fastapi import Depends, status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse, SocketTopic
from langboard_shared.domain.models import Card, CardMetadata, Project, ProjectRole
from langboard_shared.domain.models.ProjectRole import ProjectRoleAction
from langboard_shared.domain.services import DomainService
from langboard_shared.filter import RoleFilter
from langboard_shared.helpers import InfraHelper
from langboard_shared.publishers import MetadataPublisher
from langboard_shared.security import RoleFinder
from .MetadataForm import MetadataDeleteForm, MetadataForm, MetadataGetModel
from .MetadataHelper import create_metadata_api_schema


@AppRouter.schema()
@AppRouter.api.get(
    "/metadata/project/{project_uid}/card/{card_uid}",
    tags=["Metadata"],
    description="Get card metadata.",
    responses=create_metadata_api_schema("list").err(404, ApiErrorCode.NF2003).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_card_metadata(
    project_uid: str, card_uid: str, service: DomainService = DomainService.scope()
) -> JsonResponse:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)
    _, card = params

    metadata = await service.metadata.get_all_as_api(CardMetadata, card, as_dict=True)
    return JsonResponse(content={"metadata": metadata})


@AppRouter.schema(query=MetadataGetModel)
@AppRouter.api.get(
    "/metadata/project/{project_uid}/card/{card_uid}/key",
    tags=["Metadata"],
    description="Get card metadata by key.",
    responses=create_metadata_api_schema("key").err(404, ApiErrorCode.NF2003).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_card_metadata_by_key(
    project_uid: str,
    card_uid: str,
    get_query: MetadataGetModel = Depends(),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)
    _, card = params

    metadata = await service.metadata.get_by_key_as_api(CardMetadata, card, get_query.key)
    value = metadata.get("value", None) if metadata else None
    return JsonResponse(content={get_query.key: value})


@AppRouter.schema(form=MetadataForm)
@AppRouter.api.post(
    "/metadata/project/{project_uid}/card/{card_uid}",
    tags=["Metadata"],
    description="Save card metadata.",
    responses=create_metadata_api_schema().err(404, ApiErrorCode.NF2016).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def save_card_metadata(
    project_uid: str, card_uid: str, form: MetadataForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2016, status_code=status.HTTP_404_NOT_FOUND)
    _, card = params

    metadata = await service.metadata.save(CardMetadata, card, form.key, form.value, form.old_key)
    if metadata is None:
        return JsonResponse(content=ApiErrorCode.NF2016, status_code=status.HTTP_404_NOT_FOUND)

    await MetadataPublisher.updated_metadata(SocketTopic.BoardCard, card.get_uid(), form.key, form.value, form.old_key)
    return JsonResponse()


@AppRouter.schema(form=MetadataDeleteForm)
@AppRouter.api.delete(
    "/metadata/project/{project_uid}/card/{card_uid}",
    tags=["Metadata"],
    description="Delete card metadata.",
    responses=create_metadata_api_schema().err(404, ApiErrorCode.NF2003).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def delete_card_metadata(
    form: MetadataDeleteForm, project_uid: str, card_uid: str, service: DomainService = DomainService.scope()
) -> JsonResponse:
    params = InfraHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2003, status_code=status.HTTP_404_NOT_FOUND)
    _, card = params

    await service.metadata.delete(CardMetadata, card, form.keys)

    await MetadataPublisher.deleted_metadata(SocketTopic.BoardCard, card.get_uid(), form.keys)
    return JsonResponse()
