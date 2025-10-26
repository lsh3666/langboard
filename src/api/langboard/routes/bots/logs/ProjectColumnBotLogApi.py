from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import Depends, status
from models import BotLog, CardBotLog, ProjectColumn, ProjectColumnBotLog, ProjectRole
from models.ProjectRole import ProjectRoleAction
from ....filter import RoleFilter
from ....security import RoleFinder
from ....services import Service
from ..forms import BotLogPagination


@AppRouter.schema(query=BotLogPagination)
@AppRouter.api.get(
    "/bot/{bot_uid}/column/{column_uid}/logs",
    tags=["Bot.Log"],
    description="Get all bot logs for a specific column.",
    responses=(
        OpenApiSchema()
        .suc({"logs": [(BotLog, {"schema": CardBotLog.api_schema()})], "target": ProjectColumn})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2014)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_bot_logs_by_column(
    bot_uid: str, column_uid: str, pagination: BotLogPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    column = await service.project_column.get_by_uid(column_uid)
    if not column:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    logs = await service.bot_log.get_all_by_scope(
        ProjectColumnBotLog, bot, column, as_api=True, pagination=pagination, refer_time=pagination.refer_time
    )

    return JsonResponse(content={"logs": logs, "target": column.api_response()})
