from fastapi import status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.models import AppSetting, Bot, GlobalCardRelationshipType, InternalBot
from langboard_shared.models.AppSetting import AppSettingType
from langboard_shared.services import Service
from .Form import CreateSettingForm, DeleteSelectedSettingsForm, UpdateSettingForm


@AppRouter.api.post("/settings/available", tags=["AppSettings"], responses=OpenApiSchema().auth().forbidden().get())
@AuthFilter.add("admin")
async def is_settings_available() -> JsonResponse:
    return JsonResponse()


@AppRouter.api.get(
    "/settings/all",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "settings": [AppSetting],
                "bots": [(Bot, {"is_setting": True})],
                "global_relationships": [GlobalCardRelationshipType],
                "internal_bots": [(InternalBot, {"is_setting": True})],
            }
        )
        .auth()
        .forbidden()
        .get()
    ),
)
@AuthFilter.add("admin")
async def get_all_settings(service: Service = Service.scope()) -> JsonResponse:
    settings = await service.app_setting.get_all(as_api=True)
    bots = await service.bot.get_list(as_api=True, is_setting=True)
    global_relationships = await service.app_setting.get_global_relationships(as_api=True)
    internal_bots = await service.internal_bot.get_list(as_api=True, is_setting=True)

    return JsonResponse(
        content={
            "settings": settings,
            "bots": bots,
            "global_relationships": global_relationships,
            "internal_bots": internal_bots,
        }
    )


@AppRouter.api.get(
    "/settings/app/{setting_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().suc({"setting": AppSetting}, 200).auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
async def get_setting(setting_uid: str, service: Service = Service.scope()) -> JsonResponse:
    setting = await service.app_setting.get_by_uid(setting_uid, as_api=True)
    if not setting:
        return JsonResponse(content=ApiErrorCode.NF3002, status_code=status.HTTP_404_NOT_FOUND)
    return JsonResponse(content={"setting": setting})


@AppRouter.api.post(
    "/settings/app",
    tags=["AppSettings"],
    responses=OpenApiSchema().suc({"setting": AppSetting, "revealed_value": "string"}, 201).auth().forbidden().get(),
)
@AuthFilter.add("admin")
async def create_setting(form: CreateSettingForm, service: Service = Service.scope()) -> JsonResponse:
    if form.setting_type == AppSettingType.ApiKey:
        form.setting_value = await service.app_setting.generate_api_key()

    setting = await service.app_setting.create(form.setting_type, form.setting_name, form.setting_value)
    revealed_value = setting.get_value()

    return JsonResponse(
        content={"setting": setting.api_response(), "revealed_value": revealed_value},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.put(
    "/settings/app/{setting_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
async def update_setting(setting_uid: str, form: UpdateSettingForm, service: Service = Service.scope()) -> JsonResponse:
    result = await service.app_setting.update(setting_uid, form.setting_name, form.setting_value)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3002, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/app/{setting_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
async def delete_setting(setting_uid: str, service: Service = Service.scope()) -> JsonResponse:
    result = await service.app_setting.delete(setting_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3002, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/app",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
async def delete_selected_settings(
    form: DeleteSelectedSettingsForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.app_setting.delete_selected(form.setting_uids)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3002, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
