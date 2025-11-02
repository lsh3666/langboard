from fastapi import File, UploadFile, status
from langboard_shared.core.caching import Cache
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.storage import Storage, StorageName
from langboard_shared.Env import UI_QUERY_NAMES
from langboard_shared.services import Service
from .forms import ActivateUserForm, CheckEmailForm, ResendLinkForm, SignUpForm


@AppRouter.api.post(
    "/auth/signup/exist/email", tags=["Auth.SignUp"], responses=OpenApiSchema().suc({"exists": "bool"}).get()
)
async def exists_email(form: CheckEmailForm, service: Service = Service.scope()) -> JsonResponse:
    user, _ = await service.user.get_by_email(form.email)
    return JsonResponse(content={"exists": user is not None})


@AppRouter.api.post(
    "/auth/signup",
    tags=["Auth.SignUp"],
    responses=OpenApiSchema().err(409, ApiErrorCode.EX1003).err(503, ApiErrorCode.OP1001).get(),
)
async def signup(
    form: SignUpForm = SignUpForm.scope(), avatar: UploadFile | None = File(None), service: Service = Service.scope()
) -> JsonResponse:
    user, _ = await service.user.get_by_email(form.email)
    if user:
        return JsonResponse(content=ApiErrorCode.EX1003, status_code=status.HTTP_409_CONFLICT)

    file_model = Storage.upload(avatar, StorageName.Avatar) if avatar else None
    user, _ = await service.user.create(form.model_dump(), avatar=file_model)

    cache_key = service.user.create_cache_name("signup", user.email)

    token_url = await service.user.create_token_url(user, cache_key, UI_QUERY_NAMES.SIGN_UP_ACTIVATE_TOKEN)

    result = await service.email.send_template(
        user.preferred_lang, user.email, "signup", {"recipient": user.firstname, "url": token_url}
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.OP1001, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    return JsonResponse()


@AppRouter.api.post(
    "/auth/signup/resend",
    tags=["Auth.SignUp"],
    responses=(
        OpenApiSchema().err(404, ApiErrorCode.NF1004).err(409, ApiErrorCode.EX1004).err(503, ApiErrorCode.OP1001).get()
    ),
)
async def resend_signup_link(form: ResendLinkForm, service: Service = Service.scope()) -> JsonResponse:
    user, _ = await service.user.get_by_email(form.email)
    if not user:
        return JsonResponse(content=ApiErrorCode.NF1004, status_code=status.HTTP_404_NOT_FOUND)

    if user.activated_at:
        return JsonResponse(content=ApiErrorCode.EX1004, status_code=status.HTTP_409_CONFLICT)

    cache_key = service.user.create_cache_name("signup", user.email)

    await Cache.delete(cache_key)

    token_url = await service.user.create_token_url(user, cache_key, UI_QUERY_NAMES.SIGN_UP_ACTIVATE_TOKEN)

    result = await service.email.send_template(
        user.preferred_lang, user.email, "signup", {"recipient": user.firstname, "url": token_url}
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.OP1001, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    return JsonResponse()


@AppRouter.api.post(
    "/auth/signup/activate",
    tags=["Auth.SignUp"],
    responses=OpenApiSchema().err(404, ApiErrorCode.NF1004).err(409, ApiErrorCode.EX1004).get(),
)
async def activate_account(form: ActivateUserForm, service: Service = Service.scope()) -> JsonResponse:
    user, cache_key, _ = await service.user.validate_token_from_url("signup", form.signup_token)
    if not user or not cache_key:
        return JsonResponse(content=ApiErrorCode.NF1004, status_code=status.HTTP_404_NOT_FOUND)

    if user.activated_at:
        return JsonResponse(content=ApiErrorCode.EX1004, status_code=status.HTTP_409_CONFLICT)

    await service.user.activate(user)

    await Cache.delete(cache_key)

    return JsonResponse(content={"email": user.email})
