from fastapi import Depends, status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.filter import RoleFilter
from langboard_shared.models import BotLog, Project, ProjectBotLog, ProjectRole
from langboard_shared.models.ProjectRole import ProjectRoleAction
from langboard_shared.security import RoleFinder
from langboard_shared.services import Service
from ..forms import BotLogPagination


@AppRouter.schema(query=BotLogPagination)
@AppRouter.api.get(
    "/bot/{bot_uid}/project/{project_uid}/logs",
    tags=["Bot.Log"],
    description="Get all bot logs for a specific project.",
    responses=(
        OpenApiSchema()
        .suc({"logs": [(BotLog, {"schema": ProjectBotLog.api_schema()})], "target": Project})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2014)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_bot_logs_by_project(
    bot_uid: str, project_uid: str, pagination: BotLogPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    logs = await service.bot_log.get_all_by_scope(
        ProjectBotLog, bot, project, as_api=True, pagination=pagination, refer_time=pagination.refer_time
    )

    return JsonResponse(content={"logs": logs, "target": project.api_response()})
