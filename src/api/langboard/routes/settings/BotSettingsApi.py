from fastapi import File, UploadFile, status
from langboard_shared.ai import validate_bot_form
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, ApiException, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.storage import Storage, StorageName
from langboard_shared.domain.models import Bot, BotDefaultScopeBranch, SettingRole
from langboard_shared.domain.models.BaseBotModel import BotPlatform, BotPlatformRunningType
from langboard_shared.domain.models.SettingRole import SettingRoleAction
from langboard_shared.domain.services import DomainService
from langboard_shared.filter import RoleFilter
from langboard_shared.security import RoleFinder
from .Form import CreateBotDefaultScopeBranchForm, CreateBotForm, UpdateBotDefaultScopeBranchForm, UpdateBotForm


@AppRouter.api.get(
    "/settings/bots",
    tags=["AppSettings.Bot"],
    responses=(
        OpenApiSchema()
        .suc({"bots": [(Bot, {"schema": {"default_scope_branches": [BotDefaultScopeBranch]}, "is_setting": True})]})
        .auth()
        .forbidden()
        .get()
    ),
)
@RoleFilter.add(SettingRole, [SettingRoleAction.BotRead], RoleFinder.setting, allowed_all_admin=False)
@AuthFilter.add("admin")
def get_bots_in_settings(service: DomainService = DomainService.scope()) -> JsonResponse:
    bots = service.bot.get_api_list(is_setting=True)
    branches_by_bot = service.bot_default_scope_branch.get_api_map_by_bot_uid()

    bots_with_branches = []
    for bot_dict in bots:
        bot_uid: str = bot_dict["uid"]
        bot_dict["default_scope_branches"] = branches_by_bot.get(bot_uid, [])
        bots_with_branches.append(bot_dict)

    return JsonResponse(content={"bots": bots_with_branches})


@AppRouter.api.post(
    "/settings/bot",
    tags=["AppSettings.Bot"],
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
@RoleFilter.add(SettingRole, [SettingRoleAction.BotCreate], RoleFinder.setting, allowed_all_admin=False)
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
    tags=["AppSettings.Bot"],
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
@RoleFilter.add(SettingRole, [SettingRoleAction.BotUpdate], RoleFinder.setting, allowed_all_admin=False)
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
    tags=["AppSettings.Bot"],
    responses=(
        OpenApiSchema()
        .suc({"secret_app_api_token": "string", "revealed_app_api_token": "string"})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF3001)
        .get()
    ),
)
@RoleFilter.add(SettingRole, [SettingRoleAction.BotUpdate], RoleFinder.setting, allowed_all_admin=False)
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
    tags=["AppSettings.Bot"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3001).get(),
)
@RoleFilter.add(SettingRole, [SettingRoleAction.BotDelete], RoleFinder.setting, allowed_all_admin=False)
@AuthFilter.add("admin")
def delete_bot(bot_uid: str, service: DomainService = DomainService.scope()) -> JsonResponse:
    result = service.bot.delete(bot_uid)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    return JsonResponse()


@AppRouter.api.get(
    "/settings/bot/{bot_uid}/default-scope-branches",
    tags=["AppSettings.BotDefaultScopeBranch"],
    responses=(
        OpenApiSchema()
        .suc({"default_scope_branches": [BotDefaultScopeBranch]})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF3001)
        .get()
    ),
)
@RoleFilter.add(SettingRole, [SettingRoleAction.BotRead], RoleFinder.setting, allowed_all_admin=False)
@AuthFilter.add("admin")
def get_bot_default_scope_branches(bot_uid: str, service: DomainService = DomainService.scope()) -> JsonResponse:
    bot = service.bot.get_by_id_like(bot_uid)
    if not bot:
        raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    default_scopes = service.bot_default_scope_branch.get_api_list_by_bot(bot)
    return JsonResponse(content={"default_scope_branches": default_scopes})


@AppRouter.api.post(
    "/settings/bot/{bot_uid}/default-scope-branch",
    tags=["AppSettings.BotDefaultScopeBranch"],
    responses=(
        OpenApiSchema()
        .suc({"default_scope_branch": BotDefaultScopeBranch}, 201)
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF3001)
        .err(404, ApiErrorCode.NF3007)
        .get()
    ),
)
@RoleFilter.add(SettingRole, [SettingRoleAction.BotUpdate], RoleFinder.setting, allowed_all_admin=False)
@AuthFilter.add("admin")
def create_bot_default_scope_branch(
    bot_uid: str, form: CreateBotDefaultScopeBranchForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    bot = service.bot.get_by_id_like(bot_uid)
    if not bot:
        raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    default_scope_branch = service.bot_default_scope_branch.create(
        bot_id=bot.id,
        name=form.name,
    )
    if not default_scope_branch:
        raise ApiException.NotFound_404(ApiErrorCode.NF3007)

    response = default_scope_branch.api_response({})

    return JsonResponse(content={"default_scope_branch": response}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put(
    "/settings/bot/default-scope-branch/{default_scope_uid}",
    tags=["AppSettings.BotDefaultScopeBranch"],
    responses=(
        OpenApiSchema()
        .suc({"default_scope_branch": BotDefaultScopeBranch})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF3007)
        .get()
    ),
)
@RoleFilter.add(SettingRole, [SettingRoleAction.BotUpdate], RoleFinder.setting, allowed_all_admin=False)
@AuthFilter.add("admin")
def update_bot_default_scope_branch(
    default_scope_uid: str, form: UpdateBotDefaultScopeBranchForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    default_scope_branch = service.bot_default_scope_branch.get_by_id_like(default_scope_uid)
    if not default_scope_branch:
        raise ApiException.NotFound_404(ApiErrorCode.NF3007)

    update_data = {}
    if form.name is not None:
        update_data["name"] = form.name

    if form.conditions_map is not None:
        update_data["conditions_map"] = form.conditions_map

    result = service.bot_default_scope_branch.update(default_scope_branch, update_data)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3007)

    if isinstance(result, bool):
        return JsonResponse()

    response = service.bot_default_scope_branch.get_api_by_id_like_with_conditions_map(default_scope_branch.id)
    if not response:
        raise ApiException.NotFound_404(ApiErrorCode.NF3007)

    return JsonResponse(content={"default_scope_branch": response})


@AppRouter.api.delete(
    "/settings/bot/default-scope-branch/{default_scope_uid}",
    tags=["AppSettings.BotDefaultScopeBranch"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3007).get(),
)
@RoleFilter.add(SettingRole, [SettingRoleAction.BotUpdate], RoleFinder.setting, allowed_all_admin=False)
@AuthFilter.add("admin")
def delete_bot_default_scope_branch(
    default_scope_uid: str, service: DomainService = DomainService.scope()
) -> JsonResponse:
    default_scope_branch = service.bot_default_scope_branch.get_by_id_like(default_scope_uid)
    if not default_scope_branch:
        raise ApiException.NotFound_404(ApiErrorCode.NF3007)

    result = service.bot_default_scope_branch.delete(default_scope_uid)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3007)

    return JsonResponse()
