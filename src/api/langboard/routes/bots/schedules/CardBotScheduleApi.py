from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import Depends, status
from models import BotSchedule, Card, CardBotSchedule, ProjectRole
from models.ProjectRole import ProjectRoleAction
from ....ai import BotScheduleHelper
from ....filter import RoleFilter
from ....security import RoleFinder
from ....services import Service
from ..forms import BotSchedulePagination


@AppRouter.schema(query=BotSchedulePagination)
@AppRouter.api.get(
    "/bot/{bot_uid}/card/{card_uid}/schedules",
    tags=["Bot.Schedule"],
    description="Get all bot cron schedules for a specific card.",
    responses=(
        OpenApiSchema()
        .suc({"schedules": [(BotSchedule, {"schema": CardBotSchedule.api_schema()})], "target": Card})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2014)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_bot_schedules_by_card(
    bot_uid: str,
    card_uid: str,
    pagination: BotSchedulePagination = Depends(),
    service: Service = Service.scope(),
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    card = await service.card.get_by_uid(card_uid)
    if not card:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    schedules = await BotScheduleHelper.get_all_by_scope(
        CardBotSchedule,
        bot,
        card,
        as_api=True,
        pagination=pagination,
        refer_time=pagination.refer_time,
        status=pagination.status,
    )

    return JsonResponse(content={"schedules": schedules, "target": card.api_response()})
