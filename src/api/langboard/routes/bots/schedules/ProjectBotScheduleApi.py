from fastapi import Depends, status
from langboard_shared.ai import BotScheduleHelper
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.filter import RoleFilter
from langboard_shared.models import BotSchedule, Project, ProjectBotSchedule, ProjectRole
from langboard_shared.models.ProjectRole import ProjectRoleAction
from langboard_shared.security import RoleFinder
from langboard_shared.services import Service
from ..forms import BotSchedulePagination


@AppRouter.schema(query=BotSchedulePagination)
@AppRouter.api.get(
    "/bot/{bot_uid}/project/{project_uid}/schedules",
    tags=["Bot.Schedule"],
    description="Get all bot cron schedules for a specific project.",
    responses=(
        OpenApiSchema()
        .suc({"schedules": [(BotSchedule, {"schema": ProjectBotSchedule.api_schema()})], "target": Project})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2013)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_bot_schedules_by_project(
    bot_uid: str,
    project_uid: str,
    pagination: BotSchedulePagination = Depends(),
    service: Service = Service.scope(),
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    schedules = await BotScheduleHelper.get_all_by_scope(
        ProjectBotSchedule,
        bot,
        project,
        as_api=True,
        pagination=pagination,
        refer_time=pagination.refer_time,
        status=pagination.status,
    )

    return JsonResponse(content={"schedules": schedules, "target": project.api_response()})
