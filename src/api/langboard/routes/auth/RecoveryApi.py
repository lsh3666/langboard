from fastapi import status
from langboard_shared.core.caching import Cache
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.routing.Exception import InvalidError, InvalidException
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.utils.String import make_fullname
from langboard_shared.Env import UI_QUERY_NAMES
from langboard_shared.services import Service
from .forms import ResetPasswordForm, SendResetLinkForm, ValidateTokenForm


@AppRouter.api.post(
    "/auth/recovery/send",
    tags=["Auth.Recovery"],
    responses=OpenApiSchema().err(404, ApiErrorCode.NF1004).err(503, ApiErrorCode.OP1001).get(),
)
async def send_recovery_link(form: SendResetLinkForm, service: Service = Service.scope()) -> JsonResponse:
    user, _ = await service.user.get_by_token(form.email_token, form.sign_token)
    if not user:
        return JsonResponse(content=ApiErrorCode.NF1004, status_code=status.HTTP_404_NOT_FOUND)

    cache_key = service.user.create_cache_name("recovery", user.email)

    if form.is_resend:
        recovery_cache = await Cache.get(cache_key)
        if not recovery_cache or user.get_fullname() != recovery_cache["name"]:
            return JsonResponse(content=ApiErrorCode.NF1004, status_code=status.HTTP_404_NOT_FOUND)
        await Cache.delete(cache_key)
    else:
        if user.get_fullname() != make_fullname(form.firstname, form.lastname):
            raise InvalidException(InvalidError(loc="body", field="name", inputs=form.model_dump()))

    token_url = await service.user.create_token_url(user, cache_key, UI_QUERY_NAMES.RECOVERY_TOKEN)

    result = await service.email.send_template(
        user.preferred_lang, user.email, "recovery", {"recipient": user.firstname, "url": token_url}
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.OP1001, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    return JsonResponse()


@AppRouter.api.post(
    "/auth/recovery/validate", tags=["Auth.Recovery"], responses=OpenApiSchema().err(404, ApiErrorCode.NF1004).get()
)
async def validate_recovery_token(form: ValidateTokenForm, service: Service = Service.scope()) -> JsonResponse:
    user, _, _ = await service.user.validate_token_from_url("recovery", form.recovery_token)
    if not user:
        return JsonResponse(content=ApiErrorCode.NF1004, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"email": user.email})


@AppRouter.api.post(
    "/auth/recovery/reset", tags=["Auth.Recovery"], responses=OpenApiSchema().err(404, ApiErrorCode.NF1004).get()
)
async def change_password(form: ResetPasswordForm, service: Service = Service.scope()) -> JsonResponse:
    user, cache_key, _ = await service.user.validate_token_from_url("recovery", form.recovery_token)
    if not user or not cache_key:
        return JsonResponse(content=ApiErrorCode.NF1004, status_code=status.HTTP_404_NOT_FOUND)

    await service.user.change_password(user, form.password)

    await Cache.delete(cache_key)

    return JsonResponse()
