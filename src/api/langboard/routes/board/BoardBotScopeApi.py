from langboard_shared.ai import BotScopeHelper
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, ApiException, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.domain.models import ProjectRole
from langboard_shared.domain.models.ProjectRole import ProjectRoleAction
from langboard_shared.domain.services import DomainService
from langboard_shared.filter import RoleFilter
from langboard_shared.helpers import BotHelper
from langboard_shared.publishers import ProjectBotPublisher
from langboard_shared.security import RoleFinder
from .forms import CreateBotScopeForm, DeleteBotScopeForm, ToggleBotTriggerConditionForm


@AppRouter.schema(form=CreateBotScopeForm)
@AppRouter.api.post(
    "/board/{project_uid}/bot/{bot_uid}/scope",
    tags=["Board"],
    responses=(
        OpenApiSchema()
        .auth()
        .forbidden()
        .err(400, ApiErrorCode.VA3003)
        .err(404, ApiErrorCode.NF2001, ApiErrorCode.NF3001)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def create_bot_scope_in_project(
    project_uid: str, bot_uid: str, form: CreateBotScopeForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    result = BotHelper.get_target_model_by_param("scope", form.target_table, form.target_uid)
    if not result:
        raise ApiException.BadRequest_400(ApiErrorCode.VA3003)
    scope_model_class, target_scope = result

    project = await service.project.get_by_id_like(project_uid)
    if not project:
        raise ApiException.NotFound_404(ApiErrorCode.NF2001)
    bot = await service.bot.get_by_id_like(bot_uid)
    if not bot:
        raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    result = BotScopeHelper.create(scope_model_class, bot, target_scope, form.conditions)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF3001)

    await ProjectBotPublisher.scope_created(project, result)
    return JsonResponse()


@AppRouter.schema(form=ToggleBotTriggerConditionForm)
@AppRouter.api.put(
    "/board/{project_uid}/scope/{bot_scope_uid}/trigger-condition",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .auth()
        .forbidden()
        .err(400, ApiErrorCode.VA3003)
        .err(404, ApiErrorCode.NF2001, ApiErrorCode.NF2020)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def toggle_bot_trigger_condition(
    project_uid: str,
    bot_scope_uid: str,
    form: ToggleBotTriggerConditionForm,
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    scope_model_class = BotHelper.get_bot_model_class("scope", form.target_table)
    if not scope_model_class:
        raise ApiException.BadRequest_400(ApiErrorCode.VA3003)

    bot_scope = BotScopeHelper.get_by_id_like(scope_model_class, bot_scope_uid)
    if not bot_scope:
        raise ApiException.NotFound_404(ApiErrorCode.NF2020)

    project = await service.project.get_by_id_like(project_uid)
    if not project:
        raise ApiException.NotFound_404(ApiErrorCode.NF2001)

    result = BotScopeHelper.toggle_trigger_condition(scope_model_class, bot_scope, form.condition)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF2020)

    await ProjectBotPublisher.scope_conditions_updated(project, bot_scope)
    return JsonResponse()


@AppRouter.schema(form=DeleteBotScopeForm)
@AppRouter.api.delete(
    "/board/{project_uid}/scope/{bot_scope_uid}",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .auth()
        .forbidden()
        .err(400, ApiErrorCode.VA3003)
        .err(404, ApiErrorCode.NF2001, ApiErrorCode.NF2020)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def delete_bot_scope(
    project_uid: str, bot_scope_uid: str, form: DeleteBotScopeForm, service: DomainService = DomainService.scope()
) -> JsonResponse:
    scope_model_class = BotHelper.get_bot_model_class("scope", form.target_table)
    if not scope_model_class:
        raise ApiException.BadRequest_400(ApiErrorCode.VA3003)

    bot_scope = BotScopeHelper.get_by_id_like(scope_model_class, bot_scope_uid)
    if not bot_scope:
        raise ApiException.NotFound_404(ApiErrorCode.NF2020)

    project = await service.project.get_by_id_like(project_uid)
    if not project:
        raise ApiException.NotFound_404(ApiErrorCode.NF2001)

    BotScopeHelper.delete(scope_model_class, bot_scope)
    await ProjectBotPublisher.scope_deleted(project, bot_scope)
    return JsonResponse()
