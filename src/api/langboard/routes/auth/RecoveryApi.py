from langboard_shared.core.caching import Cache
from langboard_shared.core.routing import ApiErrorCode, ApiException, AppRouter, JsonResponse
from langboard_shared.core.routing.Exception import ValidationFailureException, ValidationFailureInfo
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.utils.String import make_fullname
from langboard_shared.domain.services import DomainService
from langboard_shared.Env import UI_QUERY_NAMES
from .forms import ResetPasswordForm, SendResetLinkForm, ValidateTokenForm


@AppRouter.api.post(
    "/auth/recovery/send",
    tags=["Auth.Recovery"],
    responses=OpenApiSchema().err(404, ApiErrorCode.NF1004).err(503, ApiErrorCode.OP1001).get(),
)
async def send_recovery_link(form: SendResetLinkForm, service: DomainService = DomainService.scope()) -> JsonResponse:
    user, _ = await service.user.get_by_token(form.email_token, form.sign_token)
    if not user:
        raise ApiException.NotFound_404(ApiErrorCode.NF1004)

    cache_key = service.user.create_cache_name("recovery", user.email)

    if form.is_resend:
        recovery_cache = await Cache.get(cache_key)
        if not recovery_cache or user.get_fullname() != recovery_cache["name"]:
            raise ApiException.NotFound_404(ApiErrorCode.NF1004)
        await Cache.delete(cache_key)
    else:
        if user.get_fullname() != make_fullname(form.firstname, form.lastname):
            raise ValidationFailureException(ValidationFailureInfo(loc="body", field="name", inputs=form.model_dump()))

    token_url = await service.user.create_token_url(user, cache_key, UI_QUERY_NAMES.RECOVERY_TOKEN)

    result = await service.email.send_template(
        user.preferred_lang, user.email, "recovery", {"recipient": user.firstname, "url": token_url}
    )
    if not result:
        raise ApiException.ServiceUnavailable_503(ApiErrorCode.OP1001)

    return JsonResponse()


@AppRouter.api.post(
    "/auth/recovery/validate",
    tags=["Auth.Recovery"],
    responses=OpenApiSchema().suc({"email": "string"}).err(404, ApiErrorCode.NF1004).get(),
)
async def validate_recovery_token(
    form: ValidateTokenForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    user, _, _ = await service.user.validate_token_from_url("recovery", form.recovery_token)
    if not user:
        raise ApiException.NotFound_404(ApiErrorCode.NF1004)

    return JsonResponse(content={"email": user.email})


@AppRouter.api.post(
    "/auth/recovery/reset", tags=["Auth.Recovery"], responses=OpenApiSchema().err(404, ApiErrorCode.NF1004).get()
)
async def change_password(form: ResetPasswordForm, service: DomainService = DomainService.scope()) -> JsonResponse:
    user, cache_key, _ = await service.user.validate_token_from_url("recovery", form.recovery_token)
    if not user or not cache_key:
        raise ApiException.NotFound_404(ApiErrorCode.NF1004)

    await service.user.change_password(user, form.password)

    await Cache.delete(cache_key)

    return JsonResponse()
