from fastapi import status
from langboard_shared.ai import BotScheduleHelper
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.types import SafeDateTime
from langboard_shared.domain.models import Card, Project, ProjectColumn, ProjectRole
from langboard_shared.domain.models.BotSchedule import BotScheduleRunningType
from langboard_shared.domain.models.ProjectRole import ProjectRoleAction
from langboard_shared.domain.services import DomainService
from langboard_shared.filter import RoleFilter
from langboard_shared.helpers import BotHelper
from langboard_shared.publishers import ProjectBotPublisher
from langboard_shared.security import RoleFinder
from ..forms import CreateBotCronTimeForm, DeleteBotCronTimeForm, UpdateBotCronTimeForm


@AppRouter.schema(form=CreateBotCronTimeForm)
@AppRouter.api.post(
    "/bot/{bot_uid}/schedule",
    tags=["Bot.Schedule"],
    description="Schedule a bot cron schedule.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).err(404, ApiErrorCode.NF3001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def schedule_bot_crons(
    bot_uid: str,
    form: CreateBotCronTimeForm,
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    form.interval_str = BotScheduleHelper.utils.convert_valid_interval_str(form.interval_str)
    if not form.interval_str:
        return JsonResponse(content=ApiErrorCode.VA3001, status_code=status.HTTP_400_BAD_REQUEST)

    if form.running_type == BotScheduleRunningType.Duration and not form.start_at:
        form.start_at = SafeDateTime.now()

    if not BotScheduleHelper.get_default_status_with_dates(
        running_type=form.running_type, start_at=form.start_at, end_at=form.end_at
    ):
        return JsonResponse(content=ApiErrorCode.VA3002, status_code=status.HTTP_400_BAD_REQUEST)

    result = BotHelper.get_target_model_by_param("schedule", form.target_table, form.target_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.VA3004, status_code=status.HTTP_400_BAD_REQUEST)
    target_model_class, target_model = result

    bot = await service.bot.get_by_id_like(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    bot_schedule = await BotScheduleHelper.schedule(
        target_model_class,
        bot,
        form.interval_str,
        target_model,
        form.running_type,
        form.start_at,
        form.end_at,
        form.timezone,
    )
    if not bot_schedule:
        return JsonResponse(content=ApiErrorCode.VA3005, status_code=status.HTTP_400_BAD_REQUEST)

    if isinstance(target_model, (Project, Card, ProjectColumn)):
        if isinstance(target_model, Project):
            project = target_model
        else:
            project = await service.project.get_by_id_like(target_model.project_id)

        if project:
            await ProjectBotPublisher.scheduled(project, bot_schedule)

    return JsonResponse()


@AppRouter.schema(form=UpdateBotCronTimeForm)
@AppRouter.api.put(
    "/bot/{bot_uid}/reschedule/{schedule_uid}",
    tags=["Bot.Schedule"],
    description="Reschedule a bot cron schedule.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2015).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def reschedule_bot_crons(
    bot_uid: str,
    schedule_uid: str,
    form: UpdateBotCronTimeForm,
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    if not BotScheduleHelper.get_default_status_with_dates(
        running_type=form.running_type, start_at=form.start_at, end_at=form.end_at
    ):
        return JsonResponse(content=ApiErrorCode.VA3002, status_code=status.HTTP_400_BAD_REQUEST)

    bot = await service.bot.get_by_id_like(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    result = _get_target_model_with_bot_schedule(form.target_table, schedule_uid)
    if isinstance(result, JsonResponse):
        return result
    target_model_class, bot_schedule, target_model = result

    result = await BotScheduleHelper.reschedule(
        target_model_class,
        bot_schedule,
        form.interval_str,
        form.running_type,
        form.start_at,
        form.end_at,
        form.timezone,
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.VA3005, status_code=status.HTTP_400_BAD_REQUEST)
    _, schedule_model, model = result

    if isinstance(target_model, (Project, Card, ProjectColumn)):
        if isinstance(target_model, Project):
            project = target_model
        else:
            project = await service.project.get_by_id_like(target_model.project_id)

        if project:
            await ProjectBotPublisher.rescheduled(project, schedule_model, model)

    return JsonResponse()


@AppRouter.schema(form=DeleteBotCronTimeForm)
@AppRouter.api.delete(
    "/bot/{bot_uid}/unschedule/{schedule_uid}",
    tags=["Bot.Schedule"],
    description="Unschedule a bot cron schedule.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2015).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def unschedule_bot_crons(
    bot_uid: str,
    schedule_uid: str,
    form: DeleteBotCronTimeForm,
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    bot = await service.bot.get_by_id_like(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    result = _get_target_model_with_bot_schedule(form.target_table, schedule_uid)
    if isinstance(result, JsonResponse):
        return result
    target_model_class, bot_schedule, target_model = result

    result = await BotScheduleHelper.unschedule(target_model_class, bot_schedule)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2015, status_code=status.HTTP_404_NOT_FOUND)
    _, schedule_model = result

    if isinstance(target_model, (Project, Card, ProjectColumn)):
        if isinstance(target_model, Project):
            project = target_model
        else:
            project = await service.project.get_by_id_like(target_model.project_id)

        if project:
            await ProjectBotPublisher.unscheduled(project, schedule_model)

    return JsonResponse()


def _get_target_model_with_bot_schedule(target_table: str, schedule_uid: str):
    target_model_class = BotHelper.get_bot_model_class("schedule", target_table)
    if not target_model_class:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)

    bot_schedule = BotScheduleHelper.get_by_id_like(target_model_class, schedule_uid)
    if not bot_schedule:
        return JsonResponse(content=ApiErrorCode.NF2015, status_code=status.HTTP_404_NOT_FOUND)

    target_id = bot_schedule.__dict__.get(target_model_class.get_scope_column_name())
    if not target_id:
        return JsonResponse(content=ApiErrorCode.NF2015, status_code=status.HTTP_404_NOT_FOUND)

    result = BotHelper.get_target_model_by_param("schedule", target_table, target_id)
    if not result:
        return JsonResponse(content=ApiErrorCode.VA3004, status_code=status.HTTP_400_BAD_REQUEST)
    target_model_class, target_model = result

    return target_model_class, bot_schedule, target_model
