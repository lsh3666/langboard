from fastapi import File, UploadFile, status
from langboard_shared.core.caching import Cache
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.routing.Exception import InvalidError, InvalidException
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.storage import Storage, StorageName
from langboard_shared.Env import UI_QUERY_NAMES
from langboard_shared.models import User, UserGroup
from langboard_shared.security import Auth
from langboard_shared.services import Service
from .AccountForm import (
    AddNewEmailForm,
    ChangePasswordForm,
    CreateUserGroupForm,
    EmailForm,
    UpdatePreferredLangForm,
    UpdateProfileForm,
    UpdateUserGroupAssignedEmailForm,
    VerifyNewEmailForm,
)


@AppRouter.api.put("/account/profile", tags=["Account"], responses=OpenApiSchema().auth().get())
@AuthFilter.add("user")
async def update_profile(
    form: UpdateProfileForm = UpdateProfileForm.scope(),
    avatar: UploadFile | None = File(None),
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    file_model = Storage.upload(avatar, StorageName.Avatar) if avatar else None
    form_dict = form.model_dump()
    if file_model:
        form_dict["avatar"] = file_model

    await service.user.update(user, form_dict)

    return JsonResponse()


@AppRouter.api.post(
    "/account/email",
    tags=["Account"],
    responses=(
        OpenApiSchema(201)
        .auth()
        .err(404, ApiErrorCode.NF1001)
        .err(304, ApiErrorCode.EX1001)
        .err(503, ApiErrorCode.OP1001)
        .get()
    ),
)
@AuthFilter.add("user")
async def add_new_email(
    form: AddNewEmailForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    cache_key = service.user.create_cache_name("subemail", user.email)
    existed_user, subemail = await service.user.get_by_email(form.new_email)
    if not form.is_resend:
        if existed_user:
            raise InvalidException(InvalidError(loc="body", field="new_email", inputs=form.model_dump()))

        await service.user.create_subemail(user.id, form.new_email)
    else:
        if not existed_user or existed_user.id != user.id or not subemail:
            return JsonResponse(content=ApiErrorCode.NF1001, status_code=status.HTTP_404_NOT_FOUND)

        if subemail.verified_at:
            return JsonResponse(content=ApiErrorCode.EX1001, status_code=status.HTTP_304_NOT_MODIFIED)

        await Cache.delete(cache_key)

    token_url = await service.user.create_token_url(
        user, cache_key, UI_QUERY_NAMES.SUB_EMAIL_VERIFY_TOKEN, {"email": form.new_email}
    )
    result = await service.email.send_template(
        user.preferred_lang, form.new_email, "subemail", {"recipient": user.firstname, "url": token_url}
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.OP1001, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    return JsonResponse(status_code=status.HTTP_201_CREATED)


@AppRouter.api.post(
    "/account/email/verify",
    tags=["Account"],
    responses=(
        OpenApiSchema()
        .auth()
        .err(404, ApiErrorCode.NF1001)
        .err(409, ApiErrorCode.NF1002)
        .err(304, ApiErrorCode.EX1001)
        .get()
    ),
)
@AuthFilter.add("user")
async def verify_subemail(form: VerifyNewEmailForm, service: Service = Service.scope()) -> JsonResponse:
    user, cache_key, extra = await service.user.validate_token_from_url("subemail", form.verify_token)
    if not user or not cache_key or not extra or "email" not in extra:
        return JsonResponse(content=ApiErrorCode.NF1001, status_code=status.HTTP_404_NOT_FOUND)

    existed_user, subemail = await service.user.get_by_email(extra["email"])
    if not existed_user or user.id != existed_user.id:
        return JsonResponse(content=ApiErrorCode.NF1001, status_code=status.HTTP_404_NOT_FOUND)

    if not subemail:
        return JsonResponse(content=ApiErrorCode.NF1002, status_code=status.HTTP_409_CONFLICT)

    if subemail.verified_at:
        return JsonResponse(content=ApiErrorCode.EX1001, status_code=status.HTTP_304_NOT_MODIFIED)

    await service.user.verify_subemail(subemail)

    await Cache.delete(cache_key)

    return JsonResponse()


@AppRouter.api.put(
    "/account/email",
    tags=["Account"],
    responses=(
        OpenApiSchema()
        .auth()
        .err(404, ApiErrorCode.NF1001)
        .err(423, ApiErrorCode.AU1002)
        .err(304, ApiErrorCode.EX1002)
        .get()
    ),
)
@AuthFilter.add("user")
async def change_primary_email(
    form: EmailForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    existed_user, subemail = await service.user.get_by_email(form.email)
    if not existed_user or existed_user.id != user.id or not subemail:
        return JsonResponse(content=ApiErrorCode.NF1001, status_code=status.HTTP_404_NOT_FOUND)

    if not subemail.verified_at:
        return JsonResponse(content=ApiErrorCode.AU1002, status_code=status.HTTP_423_LOCKED)

    if existed_user.email == form.email:
        return JsonResponse(content=ApiErrorCode.EX1002, status_code=status.HTTP_304_NOT_MODIFIED)

    await service.user.change_primary_email(user, subemail)
    return JsonResponse()


@AppRouter.api.delete(
    "/account/email",
    tags=["Account"],
    responses=OpenApiSchema().auth().err(404, ApiErrorCode.NF1001).err(406, ApiErrorCode.PE1002).get(),
)
@AuthFilter.add("user")
async def delete_email(
    form: EmailForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    existed_user, subemail = await service.user.get_by_email(form.email)
    if not existed_user or existed_user.id != user.id or not subemail:
        return JsonResponse(content=ApiErrorCode.NF1001, status_code=status.HTTP_404_NOT_FOUND)

    if existed_user.email == form.email:
        return JsonResponse(content=ApiErrorCode.PE1002, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    await service.user.delete_email(subemail)
    return JsonResponse()


@AppRouter.api.put("/account/password", tags=["Account"], responses=OpenApiSchema().auth().get())
@AuthFilter.add("user")
async def change_password(
    form: ChangePasswordForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    if not user.check_password(form.current_password):
        raise InvalidException(InvalidError(loc="body", field="current_password", inputs=form.model_dump()))

    await service.user.change_password(user, form.new_password)
    await Auth.reset_user(user)

    return JsonResponse()


@AppRouter.api.post(
    "/account/group",
    tags=["Account"],
    responses=OpenApiSchema().suc({"user_group": (UserGroup, {"schema": {"users": [User]}})}, 201).auth().get(),
)
@AuthFilter.add("user")
async def create_user_group(
    form: CreateUserGroupForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    group = await service.user_group.create(user, form.name)
    api_group = group.api_response()
    api_group["users"] = await service.user_group.get_user_emails_by_group(group.id, as_api=True)
    return JsonResponse(content={"user_group": api_group}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put(
    "/account/group/{group_uid}/name",
    tags=["Account"],
    responses=OpenApiSchema().auth().err(404, ApiErrorCode.NF1003).get(),
)
@AuthFilter.add("user")
async def change_user_group_name(
    group_uid: str, form: CreateUserGroupForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.user_group.change_name(user, group_uid, form.name)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF1003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/account/group/{group_uid}/emails",
    tags=["Account"],
    responses=OpenApiSchema().suc({"users": [User]}).auth().err(404, ApiErrorCode.NF1003).get(),
)
@AuthFilter.add("user")
async def update_user_group_assigned_emails(
    group_uid: str,
    form: UpdateUserGroupAssignedEmailForm,
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.user_group.update_assigned_emails(user, group_uid, form.emails)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF1003, status_code=status.HTTP_404_NOT_FOUND)

    group_users = await service.user_group.get_user_emails_by_group(group_uid, as_api=True)

    return JsonResponse(content={"users": group_users})


@AppRouter.api.delete(
    "/account/group/{group_uid}",
    tags=["Account"],
    responses=OpenApiSchema().auth().err(404, ApiErrorCode.NF1003).get(),
)
@AuthFilter.add("user")
async def delete_user_group(
    group_uid: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.user_group.delete(user, group_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF1003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/account/preferred-language",
    tags=["Account"],
    responses=OpenApiSchema().auth().err(404, ApiErrorCode.VA1003).get(),
)
@AuthFilter.add("user")
async def update_preferred_language(
    form: UpdatePreferredLangForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.user.update_preferred_lang(user, form.lang)
    if not result:
        return JsonResponse(content=ApiErrorCode.VA1003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
