from fastapi import status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.filter import RoleFilter
from langboard_shared.helpers import BotHelper, ServiceHelper
from langboard_shared.models import Bot, Card, Project, ProjectColumn, ProjectRole
from langboard_shared.models.bases import BaseBotScopeModel
from langboard_shared.models.ProjectRole import ProjectRoleAction
from langboard_shared.publishers import ProjectBotPublisher
from langboard_shared.security import RoleFinder
from langboard_shared.services import Service
from ..forms import CreateBotScopeForm, DeleteBotScopeForm, ToggleBotTriggerConditionForm


@AppRouter.schema(form=CreateBotScopeForm)
@AppRouter.api.post(
    "/bot/{bot_uid}/scope",
    tags=["Bot.Scope"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).err(404, ApiErrorCode.NF3001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def create_bot_scope_in_project(
    bot_uid: str,
    form: CreateBotScopeForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    result = BotHelper.get_target_model_by_param("scope", form.target_table, form.target_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)
    scope_model_class, target_scope = result

    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    bot_scope = await service.bot_scope.create(scope_model_class, bot, target_scope, form.conditions)
    if not bot_scope:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(target_scope, (Project, Card, ProjectColumn)):
        if isinstance(target_scope, Project):
            project = target_scope
        else:
            project = ServiceHelper.get_by_param(Project, target_scope.project_id)

        if project:
            await ProjectBotPublisher.scope_created(project, bot_scope)

    return JsonResponse()


@AppRouter.schema(form=ToggleBotTriggerConditionForm)
@AppRouter.api.put(
    "/bot/{bot_uid}/scope/{bot_scope_uid}/trigger-condition",
    tags=["Bot.Scope"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).err(404, ApiErrorCode.NF2020).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def toggle_bot_trigger_condition(
    bot_uid: str,
    bot_scope_uid: str,
    form: ToggleBotTriggerConditionForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    scope_model_class = BotHelper.get_bot_model_class("scope", form.target_table)
    if not scope_model_class:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)

    params = ServiceHelper.get_records_with_foreign_by_params((Bot, bot_uid), (scope_model_class, bot_scope_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2020, status_code=status.HTTP_404_NOT_FOUND)
    _, bot_scope = params

    target_scope = _get_target_scope(bot_scope, form.target_table)
    if isinstance(target_scope, JsonResponse):
        return target_scope

    result = await service.bot_scope.toggle_trigger_condition(scope_model_class, bot_scope, form.condition)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2020, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(target_scope, (Project, Card, ProjectColumn)):
        if isinstance(target_scope, Project):
            project = target_scope
        else:
            project = ServiceHelper.get_by_param(Project, target_scope.project_id)

        if project:
            await ProjectBotPublisher.scope_conditions_updated(project, bot_scope)

    return JsonResponse()


@AppRouter.schema(form=DeleteBotScopeForm)
@AppRouter.api.delete(
    "/bot/{bot_uid}/scope/{bot_scope_uid}",
    tags=["Bot.Scope"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).err(404, ApiErrorCode.NF2020).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def delete_bot_scope(
    bot_uid: str,
    bot_scope_uid: str,
    form: DeleteBotScopeForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    scope_model_class = BotHelper.get_bot_model_class("scope", form.target_table)
    if not scope_model_class:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)

    params = ServiceHelper.get_records_with_foreign_by_params((Bot, bot_uid), (scope_model_class, bot_scope_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2020, status_code=status.HTTP_404_NOT_FOUND)
    _, bot_scope = params

    target_scope = _get_target_scope(bot_scope, form.target_table)
    if isinstance(target_scope, JsonResponse):
        return target_scope

    await service.bot_scope.delete(scope_model_class, bot_scope)

    if isinstance(target_scope, (Project, Card, ProjectColumn)):
        if isinstance(target_scope, Project):
            project = target_scope
        else:
            project = ServiceHelper.get_by_param(Project, target_scope.project_id)

        if project:
            await ProjectBotPublisher.scope_deleted(project, bot_scope)

    return JsonResponse()


def _get_target_scope(bot_scope: BaseBotScopeModel, target_table: str):
    target_id = bot_scope.__dict__.get(bot_scope.get_scope_column_name())
    if not target_id:
        return JsonResponse(content=ApiErrorCode.NF2020, status_code=status.HTTP_404_NOT_FOUND)

    result = BotHelper.get_target_model_by_param("scope", target_table, target_id)
    if not result:
        return JsonResponse(content=ApiErrorCode.VA3004, status_code=status.HTTP_400_BAD_REQUEST)
    _, target_scope = result
    return target_scope
