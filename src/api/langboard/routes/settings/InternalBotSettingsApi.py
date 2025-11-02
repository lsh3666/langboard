from fastapi import File, UploadFile, status
from langboard_shared.ai import validate_bot_form
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.storage import Storage, StorageName
from langboard_shared.services import Service
from .Form import CreateInternalBotForm, UpdateInternalBotForm


@AppRouter.api.post(
    "/settings/internal-bot",
    tags=["AppSettings"],
    responses=(OpenApiSchema(201).auth().forbidden().get()),
)
@AuthFilter.add("admin")
async def create_internal_bot(
    form: CreateInternalBotForm = CreateInternalBotForm.scope(),
    avatar: UploadFile | None = File(None),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not validate_bot_form(form):
        return JsonResponse(content=ApiErrorCode.VA0000, status_code=status.HTTP_400_BAD_REQUEST)

    file_model = Storage.upload(avatar, StorageName.InternalBot) if avatar else None
    internal_bot = await service.internal_bot.create(
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
async def update_internal_bot(
    internal_bot_uid: str,
    form: UpdateInternalBotForm = UpdateInternalBotForm.scope(),
    avatar: UploadFile | None = File(None),
    service: Service = Service.scope(),
) -> JsonResponse:
    internal_bot = await service.internal_bot.get_by_uid(internal_bot_uid)
    if not internal_bot:
        return JsonResponse(content=ApiErrorCode.NF3004, status_code=status.HTTP_404_NOT_FOUND)

    form_dict = form.model_dump()
    file_model = Storage.upload(avatar, StorageName.InternalBot) if avatar else None
    if file_model:
        form_dict["avatar"] = file_model

    result = await service.internal_bot.update(internal_bot, form_dict)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3004, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/settings/internal-bot/{internal_bot_uid}/default",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3004).get(),
)
@AuthFilter.add("admin")
async def set_internal_bot_default(internal_bot_uid: str, service: Service = Service.scope()) -> JsonResponse:
    internal_bot = await service.internal_bot.change_default(internal_bot_uid)
    if not internal_bot:
        return JsonResponse(content=ApiErrorCode.NF3004, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/internal-bot/{internal_bot_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3004).err(409, ApiErrorCode.EX3002).get(),
)
@AuthFilter.add("admin")
async def delete_internal_bot(internal_bot_uid: str, service: Service = Service.scope()) -> JsonResponse:
    internal_bot = await service.internal_bot.get_by_uid(internal_bot_uid)
    if not internal_bot:
        return JsonResponse(content=ApiErrorCode.NF3004, status_code=status.HTTP_404_NOT_FOUND)

    if internal_bot.is_default:
        return JsonResponse(content=ApiErrorCode.EX3002, status_code=status.HTTP_409_CONFLICT)

    await service.internal_bot.delete(internal_bot)
    return JsonResponse()
