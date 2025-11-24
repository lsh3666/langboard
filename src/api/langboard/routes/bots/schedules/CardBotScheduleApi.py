from fastapi import Depends, status
from langboard_shared.ai import BotScheduleHelper
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.domain.models import BotSchedule, Card, CardBotSchedule, ProjectRole
from langboard_shared.domain.models.ProjectRole import ProjectRoleAction
from langboard_shared.domain.services import DomainService
from langboard_shared.filter import RoleFilter
from langboard_shared.security import RoleFinder
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
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    bot = await service.bot.get_by_id_like(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    card = await service.card.get_by_id_like(card_uid)
    if not card:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    schedules = await BotScheduleHelper.get_all_by_scope(
        CardBotSchedule, bot, card, as_api=True, pagination=pagination, status=pagination.status
    )

    return JsonResponse(content={"schedules": schedules, "target": card.api_response()})
