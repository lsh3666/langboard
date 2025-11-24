from fastapi import status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.domain.models import GlobalCardRelationshipType
from langboard_shared.domain.services import DomainService
from .Form import (
    CreateGlobalRelationshipTypeForm,
    DeleteSelectedGlobalRelationshipTypesForm,
    ImportGlobalRelationshipTypesForm,
    UpdateGlobalRelationshipTypeForm,
)


@AppRouter.api.post(
    "/settings/global-relationship",
    tags=["AppSettings"],
    responses=OpenApiSchema().suc({"global_relationship": GlobalCardRelationshipType}, 201).auth().forbidden().get(),
)
@AuthFilter.add("admin")
async def create_global_relationship(
    form: CreateGlobalRelationshipTypeForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    global_relationship = await service.app_setting.create_global_relationship(
        form.parent_name, form.child_name, form.description
    )

    return JsonResponse(
        content={"global_relationship": global_relationship.api_response()}, status_code=status.HTTP_201_CREATED
    )


@AppRouter.api.post(
    "/settings/import-global-relationships",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema().suc({"global_relationships": [GlobalCardRelationshipType]}, 201).auth().forbidden().get()
    ),
)
@AuthFilter.add("admin")
async def import_global_relationships(
    form: ImportGlobalRelationshipTypesForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    global_relationships = await service.app_setting.import_global_relationship(
        [(rel.parent_name, rel.child_name, rel.description) for rel in form.relationships]
    )

    return JsonResponse(
        content={"global_relationships": [gr.api_response() for gr in global_relationships]},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.put(
    "/settings/global-relationship/{global_relationship_uid}",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "parent_name?": "string",
                "child_name?": "string",
                "description?": "string",
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF3003)
        .get()
    ),
)
@AuthFilter.add("admin")
async def update_global_relationship(
    global_relationship_uid: str, form: UpdateGlobalRelationshipTypeForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    form_dict = form.model_dump()

    result = await service.app_setting.update_global_relationship(global_relationship_uid, form_dict)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3003, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(result, bool):
        return JsonResponse()

    _, model = result

    return JsonResponse(content={**model})


@AppRouter.api.delete(
    "/settings/global-relationship/{global_relationship_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3003).get(),
)
@AuthFilter.add("admin")
async def delete_global_relationship(
    global_relationship_uid: str, service: DomainService = DomainService.scope()
) -> JsonResponse:
    result = await service.app_setting.delete_global_relationship(global_relationship_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/global-relationship",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3003).get(),
)
@AuthFilter.add("admin")
async def delete_selected_global_relationship(
    form: DeleteSelectedGlobalRelationshipTypesForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    result = await service.app_setting.delete_selected_global_relationships(form.relationship_type_uids)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
