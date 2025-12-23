from fastapi import File, UploadFile, status
from langboard_shared.ai import validate_bot_form
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, ApiException, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.storage import Storage, StorageName
from langboard_shared.domain.models import InternalBot
from langboard_shared.domain.services import DomainService
from .Form import CreateInternalBotForm, UpdateInternalBotForm


@AppRouter.api.post(
    "/settings/internal-bot",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc({"internal_bot": (InternalBot, {"is_setting": True})}, 201)
        .auth()
        .forbidden()
        .err(400, ApiErrorCode.VA0000)
        .get()
    ),
)
@AuthFilter.add("admin")
def create_internal_bot(
    form: CreateInternalBotForm = CreateInternalBotForm.scope(),
    avatar: UploadFile | None = File(None),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    if not validate_bot_form(form):
        raise ApiException.BadRequest_400(ApiErrorCode.VA0000)

    file_model = Storage.upload(avatar, StorageName.InternalBot) if avatar else None
    internal_bot = service.internal_bot.create(
        form.bot_type,
        form.display_name,
        form.platform,
        form.platform_running_type,
        form.api_url,
        form.value,
        form.api_key,
        file_model,
    )

    return JsonResponse(
        content={"internal_bot": internal_bot.api_response(is_setting=True)},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.put(
    "/settings/internal-bot/{internal_bot_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3004).get(),
)
@AuthFilter.add("admin")
def update_internal_bot(
    internal_bot_uid: str,
    form: UpdateInternalBotForm = UpdateInternalBotForm.scope(),
    avatar: UploadFile | None = File(None),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    internal_bot = service.internal_bot.get_by_id_like(internal_bot_uid)
    if not internal_bot:
        raise ApiException.NotFound_404(ApiErrorCode.NF3004)

    form_dict = form.model_dump()
    file_model = Storage.upload(avatar, StorageName.InternalBot) if avatar else None
    if file_model:
        form_dict["avatar"] = file_model

    result = service.internal_bot.update(internal_bot, form_dict)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3004)

    return JsonResponse()


@AppRouter.api.put(
    "/settings/internal-bot/{internal_bot_uid}/default",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3004).get(),
)
@AuthFilter.add("admin")
def set_internal_bot_default(internal_bot_uid: str, service: DomainService = DomainService.scope()) -> JsonResponse:
    internal_bot = service.internal_bot.change_default(internal_bot_uid)
    if not internal_bot:
        raise ApiException.NotFound_404(ApiErrorCode.NF3004)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/internal-bot/{internal_bot_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3004).err(409, ApiErrorCode.EX3002).get(),
)
@AuthFilter.add("admin")
def delete_internal_bot(internal_bot_uid: str, service: DomainService = DomainService.scope()) -> JsonResponse:
    internal_bot = service.internal_bot.get_by_id_like(internal_bot_uid)
    if not internal_bot:
        raise ApiException.NotFound_404(ApiErrorCode.NF3004)

    if internal_bot.is_default:
        raise ApiException.Conflict_409(ApiErrorCode.EX3002)

    service.internal_bot.delete(internal_bot)
    return JsonResponse()
