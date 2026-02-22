from fastapi import status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, ApiException, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.domain.models import AppSetting, Bot, GlobalCardRelationshipType, InternalBot
from langboard_shared.domain.models.AppSetting import AppSettingType
from langboard_shared.domain.services import DomainService
from .Form import CreateSettingForm, DeleteSelectedSettingsForm, UpdateSettingForm


@AppRouter.api.post("/settings/available", tags=["AppSettings"], responses=OpenApiSchema().auth().forbidden().get())
@AuthFilter.add("admin")
def is_settings_available() -> JsonResponse:
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
def get_all_settings(service: DomainService = DomainService.scope()) -> JsonResponse:
    settings = service.app_setting.get_api_list()
    bots = service.bot.get_api_list(is_setting=True)
    global_relationships = service.app_setting.get_api_global_relationship_list()
    internal_bots = service.internal_bot.get_api_list(is_setting=True)

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
    responses=OpenApiSchema().suc({"setting": AppSetting}).auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
def get_setting(setting_uid: str, service: DomainService = DomainService.scope()) -> JsonResponse:
    setting = service.app_setting.get_by_id_like(setting_uid)
    if not setting:
        raise ApiException.NotFound_404(ApiErrorCode.NF3002)
    return JsonResponse(content={"setting": setting.api_response()})


@AppRouter.api.post(
    "/settings/app",
    tags=["AppSettings"],
    responses=OpenApiSchema().suc({"setting": AppSetting, "revealed_value": "string"}, 201).auth().forbidden().get(),
)
@AuthFilter.add("admin")
def create_setting(form: CreateSettingForm, service: DomainService = DomainService.scope()) -> JsonResponse:
    if form.setting_type == AppSettingType.ApiKey:
        form.setting_value = service.app_setting.generate_api_key()

    setting = service.app_setting.create(form.setting_type, form.setting_name, form.setting_value)
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
def update_setting(
    setting_uid: str, form: UpdateSettingForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    result = service.app_setting.update(setting_uid, form.setting_name, form.setting_value)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3002)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/app/{setting_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
def delete_setting(setting_uid: str, service: DomainService = DomainService.scope()) -> JsonResponse:
    result = service.app_setting.delete(setting_uid)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3002)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/app",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
def delete_selected_settings(
    form: DeleteSelectedSettingsForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    result = service.app_setting.delete_selected(form.setting_uids)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3002)

    return JsonResponse()
