from typing import Any, cast
from fastapi import Depends, status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, ApiException, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema, PaginatedList
from langboard_shared.core.types import SafeDateTime
from langboard_shared.domain.models import User, UserProfile
from langboard_shared.domain.services import DomainService
from langboard_shared.security import Auth
from .Form import CreateUserForm, DeleteSelectedUsersForm, UpdateUserForm, UsersPagination


@AppRouter.api.get(
    "/settings/users",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc(
            PaginatedList.api_schema(((User, UserProfile), {"schema": {"activated_at": "string?", "is_admin": "bool"}}))
        )
        .auth()
        .forbidden()
        .get()
    ),
)
@AuthFilter.add("admin")
def get_users_in_settings(
    pagination: UsersPagination = Depends(), service: DomainService = DomainService.scope()
) -> JsonResponse:
    result = service.user.get_api_list_in_settings(refer_time=pagination.refer_time, only_count=pagination.only_count)
    if pagination.only_count:
        count_new_records = cast(int, result)
        return JsonResponse(content=PaginatedList(count_new_records=count_new_records))
    users, count_new_records = cast(tuple[list[dict[str, Any]], int], result)

    return JsonResponse(
        content=PaginatedList(
            records=users,
            count_new_records=count_new_records,
        )
    )


@AppRouter.api.post(
    "/settings/users",
    tags=["AppSettings"],
    responses=OpenApiSchema(201).auth().err(409, ApiErrorCode.EX1003).forbidden().get(),
)
@AuthFilter.add("admin")
def create_user_in_settings(form: CreateUserForm, service: DomainService = DomainService.scope()) -> JsonResponse:
    user, _ = service.user.get_by_email(form.email)
    if user:
        raise ApiException.Conflict_409(ApiErrorCode.EX1003)

    form_dict = form.model_dump()
    if form.should_activate:
        now = SafeDateTime.now()
        form_dict["created_at"] = now
        form_dict["updated_at"] = now
        form_dict["activated_at"] = now

    user, _ = service.user.create(form_dict)

    return JsonResponse(status_code=status.HTTP_201_CREATED)


@AppRouter.api.put(
    "/settings/users/{user_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF1004).get(),
)
@AuthFilter.add("admin")
def update_user_in_settings(
    user_uid: str, form: UpdateUserForm, user: User = Auth.scope("user"), service: DomainService = DomainService.scope()
) -> JsonResponse:
    target_user = service.user.get_by_id_like(user_uid)
    if not target_user:
        raise ApiException.NotFound_404(ApiErrorCode.NF1004)

    form_dict = form.model_dump(exclude_unset=True)
    if user.id != target_user.id:
        if form.activate:
            form_dict["activated_at"] = SafeDateTime.now()
        elif form.activate is False:
            form_dict["activated_at"] = None

    service.user.update(target_user, form_dict, from_setting=True)

    if form.password:
        service.user.change_password(target_user, form.password)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/users/{user_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF1004).err(409, ApiErrorCode.OP1003).get(),
)
@AuthFilter.add("admin")
def delete_user_in_settings(
    user_uid: str, user: User = Auth.scope("user"), service: DomainService = DomainService.scope()
) -> JsonResponse:
    target_user = service.user.get_by_id_like(user_uid)
    if not target_user:
        raise ApiException.NotFound_404(ApiErrorCode.NF1004)

    if target_user.id == user.id:
        raise ApiException.Conflict_409(ApiErrorCode.OP1003)

    service.user.delete(target_user)

    return JsonResponse()


@AppRouter.api.delete("/settings/users", tags=["AppSettings"], responses=OpenApiSchema().auth().forbidden().get())
@AuthFilter.add("admin")
def delete_selected_users_in_settings(
    form: DeleteSelectedUsersForm, user: User = Auth.scope("user"), service: DomainService = DomainService.scope()
) -> JsonResponse:
    user_uid = user.get_uid()
    form.user_uids = [uid for uid in form.user_uids if uid != user_uid]

    service.user.delete_selected(form.user_uids)

    return JsonResponse()
