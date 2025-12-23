from fastapi import File, UploadFile, status
from langboard_shared.ai import validate_bot_form
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, ApiException, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.storage import Storage, StorageName
from langboard_shared.domain.models import Bot
from langboard_shared.domain.models.BaseBotModel import BotPlatform, BotPlatformRunningType
from langboard_shared.domain.services import DomainService
from .Form import CreateBotForm, UpdateBotForm


@AppRouter.api.post(
    "/settings/bot",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc({"bot": (Bot, {"is_setting": True}), "revealed_app_api_token": "string"}, 201)
        .auth()
        .forbidden()
        .err(400, ApiErrorCode.VA0000)
        .err(409, ApiErrorCode.EX3001)
        .get()
    ),
)
@AuthFilter.add("admin")
def create_bot(
    form: CreateBotForm = CreateBotForm.scope(),
    avatar: UploadFile | None = File(None),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    if not validate_bot_form(form):
        raise ApiException.BadRequest_400(ApiErrorCode.VA0000)

    uploaded_avatar = None
    file_model = Storage.upload(avatar, StorageName.BotAvatar) if avatar else None
    if file_model:
        uploaded_avatar = file_model

    if form.ip_whitelist is not None:
        ip_whitelist = form.ip_whitelist.strip().replace(" ", "")
        ip_whitelist = ip_whitelist.split(",") if ip_whitelist else []
    else:
        ip_whitelist = []

    bot = service.bot.create(
        form.bot_name,
        form.bot_uname,
        form.platform,
        form.platform_running_type,
        form.api_url,
        form.api_key,
        ip_whitelist,
        form.value,
        uploaded_avatar,
    )
    if not bot:
        raise ApiException.Conflict_409(ApiErrorCode.EX3001)

    return JsonResponse(
        content={"bot": bot.api_response(is_setting=True), "revealed_app_api_token": bot.app_api_token},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.put(
    "/settings/bot/{bot_uid}",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "name?": "string",
                "bot_uname?": "string",
                "avatar?": "string",
                "platform": BotPlatform,
                "platform_running_type": BotPlatformRunningType,
                "api_url?": "string",
                "api_key?": "string",
                "deleted_avatar?": "bool",
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF3001)
        .err(409, ApiErrorCode.EX3001)
        .get()
    ),
)
@AuthFilter.add("admin")
def update_bot(
    bot_uid: str,
    form: UpdateBotForm = UpdateBotForm.scope(),
    avatar: UploadFile | None = File(None),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    bot = service.bot.get_by_id_like(bot_uid)
    if not bot:
        raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    form_dict = form.model_dump()
    if "bot_name" in form_dict:
        form_dict["name"] = form_dict.pop("bot_name")

    if "ip_whitelist" in form_dict:
        form_dict.pop("ip_whitelist")

    file_model = Storage.upload(avatar, StorageName.BotAvatar) if avatar else None
    if file_model:
        form_dict["avatar"] = file_model

    result = service.bot.update(bot, form_dict)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    if form.ip_whitelist is not None:
        ip_whitelist = form.ip_whitelist.strip().replace(" ", "")
        ip_whitelist = ip_whitelist.split(",") if ip_whitelist else []
        ip_result = service.bot.update_ip_whitelist(bot, ip_whitelist)
        if not ip_result:
            raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    if isinstance(result, bool):
        if not result:
            raise ApiException.Conflict_409(ApiErrorCode.EX3001)
        return JsonResponse()

    _, model = result

    return JsonResponse(content=model)


@AppRouter.api.put(
    "/settings/bot/{bot_uid}/new-api-token",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc({"secret_app_api_token": "string", "revealed_app_api_token": "string"})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF3001)
        .get()
    ),
)
@AuthFilter.add("admin")
def generate_new_bot_api_token(bot_uid: str, service: DomainService = DomainService.scope()) -> JsonResponse:
    bot = service.bot.generate_new_api_token(bot_uid)
    if not bot:
        raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    return JsonResponse(
        content={
            "secret_app_api_token": bot.api_response(is_setting=True)["app_api_token"],
            "revealed_app_api_token": bot.app_api_token,
        }
    )


@AppRouter.api.delete(
    "/settings/bot/{bot_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3001).get(),
)
@AuthFilter.add("admin")
def delete_bot(bot_uid: str, service: DomainService = DomainService.scope()) -> JsonResponse:
    result = service.bot.delete(bot_uid)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    return JsonResponse()
